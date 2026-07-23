//+------------------------------------------------------------------+
//|                                              JurnalN_Sync.mq5    |
//|                                  Copyright 2026, Jurnal-N Team   |
//|                                            https://jurnal-n.app  |
//+------------------------------------------------------------------+
#property copyright "Jurnal-N Team"
#property link      "https://jurnal-n.app"
#property version   "1.00"
#property description "Expert Advisor untuk sinkronisasi otomatis transaksi MT5 ke Web Jurnal-N (Supabase)"

//--- Input Parameters
input string   InpSupabaseUrl = "https://YOUR_SUPABASE_REF.supabase.co/rest/v1/jurnal"; // Supabase REST API URL
input string   InpApiKey      = "YOUR_SUPABASE_ANON_KEY";                                // Supabase Anon Key
input string   InpUserId      = "YOUR_SUPABASE_USER_ID";                                 // User ID (UUID dari web)
input int      InpCheckSec    = 10;                                                     // Interval Cek Trade Baru (detik)

//--- Global Variables
ulong m_processed_tickets[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("JurnalN_Sync EA Init started.");
   
   // Set timer untuk pengecekan berkala
   EventSetTimer(InpCheckSec);
   
   // Pre-load trade history agar trade lama tidak terkirim ganda
   LoadHistoryTickets();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("JurnalN_Sync EA Deinitialized.");
}

//+------------------------------------------------------------------+
//| Expert timer function                                            |
//+------------------------------------------------------------------+
void OnTimer()
{
   CheckAndSyncTrades();
}

//+------------------------------------------------------------------+
//| Membaca tiket transaksi lama saat init                            |
//+------------------------------------------------------------------+
void LoadHistoryTickets()
{
   if(!HistorySelect(0, TimeCurrent())) return;
   
   int total_deals = HistoryDealsTotal();
   for(int i = 0; i < total_deals; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0)
      {
         long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)
         {
            AddProcessedTicket(ticket);
         }
      }
   }
   Print("Loaded ", ArraySize(m_processed_tickets), " historical tickets to prevent duplicates.");
}

//+------------------------------------------------------------------+
//| Memeriksa trade tertutup baru dan mengirim ke Web API            |
//+------------------------------------------------------------------+
void CheckAndSyncTrades()
{
   datetime now = TimeCurrent();
   datetime start_time = now - 86400 * 7; // Cek 7 hari terakhir
   
   if(!HistorySelect(start_time, now)) return;
   
   int total_deals = HistoryDealsTotal();
   for(int i = 0; i < total_deals; i++)
   {
      ulong deal_ticket = HistoryDealGetTicket(i);
      if(deal_ticket <= 0) continue;
      
      // Hanya proses deal OUT (posisi ditutup)
      long entry_type = HistoryDealGetInteger(deal_ticket, DEAL_ENTRY);
      if(entry_type != DEAL_ENTRY_OUT && entry_type != DEAL_ENTRY_INOUT) continue;
      
      // Lewati jika tiket sudah pernah diproses
      if(IsTicketProcessed(deal_ticket)) continue;
      
      // Ambil detail deal
      long deal_type    = HistoryDealGetInteger(deal_ticket, DEAL_TYPE);
      if(deal_type != DEAL_TYPE_BUY && deal_type != DEAL_TYPE_SELL) continue;
      
      string symbol     = HistoryDealGetString(deal_ticket, DEAL_SYMBOL);
      double volume     = HistoryDealGetDouble(deal_ticket, DEAL_VOLUME);
      double close_price= HistoryDealGetDouble(deal_ticket, DEAL_PRICE);
      double profit     = HistoryDealGetDouble(deal_ticket, DEAL_PROFIT);
      double swap       = HistoryDealGetDouble(deal_ticket, DEAL_SWAP);
      double commission = HistoryDealGetDouble(deal_ticket, DEAL_COMMISSION);
      datetime close_time = (datetime)HistoryDealGetInteger(deal_ticket, DEAL_TIME);
      long position_id  = HistoryDealGetInteger(deal_ticket, DEAL_POSITION_ID);
      
      // Dapatkan harga open dari deal entry IN
      double open_price = close_price;
      datetime open_time = close_time;
      GetOpenDealDetails(position_id, open_price, open_time);
      
      double net_profit = profit + swap + commission;
      string arah = (deal_type == DEAL_TYPE_BUY) ? "SELL" : "BUY";
      
      string hasil_trade = "break_even";
      if(net_profit > 0.01)       hasil_trade = "win";
      else if(net_profit < -0.01) hasil_trade = "lose";
      
      // Format tanggal ISO (YYYY-MM-DD)
      MqlDateTime dt;
      TimeToStruct(close_time, dt);
      string tanggal = StringFormat("%04d-%02d-%02d", dt.year, dt.mon, dt.day);
      
      string open_time_iso  = FormatISO8601(open_time);
      string close_time_iso = FormatISO8601(close_time);
      
      // Buat JSON Body
      string json_payload = StringFormat(
         "{"
         "\"user_id\":\"%s\","
         "\"mt5_ticket\":\"%I64u\","
         "\"tanggal\":\"%s\","
         "\"pair\":\"%s\","
         "\"arah\":\"%s\","
         "\"lot_size\":%.2f,"
         "\"open_price\":%.5f,"
         "\"close_price\":%.5f,"
         "\"profit_nominal\":%.2f,"
         "\"hasil_trade\":\"%s\","
         "\"open_time\":\"%s\","
         "\"close_time\":\"%s\","
         "\"is_auto_synced\":true"
         "}",
         InpUserId,
         deal_ticket,
         tanggal,
         symbol,
         arah,
         volume,
         open_price,
         close_price,
         net_profit,
         hasil_trade,
         open_time_iso,
         close_time_iso
      );
      
      // Kirim via WebRequest ke Supabase
      if(SendToSupabase(json_payload))
      {
         Print("Sukses Sync Trade MT5 Ticket #", deal_ticket, " [", symbol, " ", arah, " Profit: $", net_profit, "]");
         AddProcessedTicket(deal_ticket);
      }
   }
}

//+------------------------------------------------------------------+
//| Cari detail deal pembukaan posisi                                |
//+------------------------------------------------------------------+
void GetOpenDealDetails(long position_id, double &open_price, datetime &open_time)
{
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong t = HistoryDealGetTicket(i);
      if(t > 0 && HistoryDealGetInteger(t, DEAL_POSITION_ID) == position_id)
      {
         if(HistoryDealGetInteger(t, DEAL_ENTRY) == DEAL_ENTRY_IN)
         {
            open_price = HistoryDealGetDouble(t, DEAL_PRICE);
            open_time  = (datetime)HistoryDealGetInteger(t, DEAL_TIME);
            return;
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Kirim HTTP POST ke Supabase REST API                             |
//+------------------------------------------------------------------+
bool SendToSupabase(string json_body)
{
   char data[];
   char result[];
   string result_headers;
   
   StringToCharArray(json_body, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data) > 0 && data[ArraySize(data)-1] == 0)
      ArrayResize(data, ArraySize(data)-1);
      
   string headers = StringFormat(
      "Content-Type: application/json\r\n"
      "apikey: %s\r\n"
      "Authorization: Bearer %s\r\n"
      "Prefer: return=minimal\r\n",
      InpApiKey, InpApiKey
   );
   
   ResetLastError();
   int res = WebRequest("POST", InpSupabaseUrl, headers, 5000, data, result, result_headers);
   
   if(res == 201 || res == 200 || res == 204)
   {
      return true;
   }
   else
   {
      Print("WebRequest Gagal. HTTP Code: ", res, " | Error Code: ", GetLastError());
      if(res == -1 && GetLastError() == 4014)
      {
         Print("PERHATIAN: Tambahkan URL '", InpSupabaseUrl, "' ke Tools -> Options -> Expert Advisors -> Allow WebRequest!");
      }
      return false;
   }
}

//+------------------------------------------------------------------+
//| Helper Cek / Tambah Tiket Terproses                              |
//+------------------------------------------------------------------+
bool IsTicketProcessed(ulong ticket)
{
   int sz = ArraySize(m_processed_tickets);
   for(int i = 0; i < sz; i++)
   {
      if(m_processed_tickets[i] == ticket) return true;
   }
   return false;
}

void AddProcessedTicket(ulong ticket)
{
   if(!IsTicketProcessed(ticket))
   {
      int sz = ArraySize(m_processed_tickets);
      ArrayResize(m_processed_tickets, sz + 1);
      m_processed_tickets[sz] = ticket;
   }
}

//+------------------------------------------------------------------+
//| Helper Format ISO8601 UTC Date String                            |
//+------------------------------------------------------------------+
string FormatISO8601(datetime dt_time)
{
   MqlDateTime dt;
   TimeToStruct(dt_time, dt);
   return StringFormat("%04d-%02d-%02dT%02d:%02d:%02d.000Z", dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}
