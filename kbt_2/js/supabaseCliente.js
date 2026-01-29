// /public/js/supabaseCliente.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://oqrutzrrgwnllnsqfjxh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xcnV0enJyZ3dubGxuc3FmanhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDQ4OTcsImV4cCI6MjA4NTIyMDg5N30.uk7qEVUkU2Kfvuv2txHyIXD2LVPdKAdLv8mG3TBCCf8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
