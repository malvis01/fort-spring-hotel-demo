/* Public browser config only. Never place a Supabase service-role key here. */
const SUPABASE_URL = "https://xvgdsdklugcplomhokpc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6b6VRlDSQblPF8tEwy9MZQ_mLE5jZ8u";
const hasConfig = SUPABASE_URL.startsWith("https://") && SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");
const db = hasConfig && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();
$("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => $("mainNav").classList.remove("open")));
const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
$("checkIn").min = today.toISOString().slice(0,10);
$("checkIn").addEventListener("change", () => { const d = new Date($("checkIn").value + "T12:00:00"); d.setDate(d.getDate()+1); $("checkOut").min = d.toISOString().slice(0,10); if ($("checkOut").value && $("checkOut").value <= $("checkIn").value) $("checkOut").value = ""; });
let rooms = [];
function message(text, error=false){ $("formMessage").textContent=text; $("formMessage").classList.toggle("error",error); }
function escapeHTML(value){return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function money(value){return new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(value||0));}
async function loadRooms(){
 if(!db) return;
 const {data,error}=await db.from("fs_rooms").select("id,name,slug,description,room_type,nightly_rate,capacity_adults,capacity_children,amenities,cover_image_url").eq("is_published",true).eq("is_active",true).order("sort_order");
 if(error){console.warn("Rooms could not load:",error.message);return;}
 rooms=data||[];
 const select=$("roomId"); select.innerHTML='<option value="">Choose a room</option>'+rooms.map(r=>'<option value="'+escapeHTML(r.id)+'">'+escapeHTML(r.name)+' — '+money(r.nightly_rate)+' / night</option>').join("");
 if(rooms.length){
  $("roomGrid").innerHTML=rooms.map((r,i)=>'<article class="room-card"><div class="room-image '+(r.cover_image_url?'':'image-'+(['one','two','three'][i%3]))+'" '+(r.cover_image_url?'style="background-image:url(\''+escapeHTML(r.cover_image_url)+'\');background-size:cover;background-position:center"':'')+'></div><div class="room-info"><span class="pill">'+escapeHTML(r.room_type||"ROOM")+'</span><h3>'+escapeHTML(r.name)+'</h3><p>'+escapeHTML(r.description||"Contact the hotel for room details.")+'</p><div class="room-bottom"><span class="rate">'+money(r.nightly_rate)+' / night</span><button class="small-link" data-room="'+escapeHTML(r.id)+'">Request ↗</button></div></div></article>').join("");
  document.querySelectorAll("[data-room]").forEach(b=>b.addEventListener("click",()=>{$("roomId").value=b.dataset.room;$("booking").scrollIntoView({behavior:"smooth"});}));
 }
}
document.querySelectorAll("[data-book]").forEach(b=>b.addEventListener("click",()=>{$("booking").scrollIntoView({behavior:"smooth"});}));
$("bookingForm").addEventListener("submit",async event=>{
 event.preventDefault(); message("");
 if(!db){message("Booking requests are not connected yet. Please contact the hotel directly.",true);return;}
 const checkIn=$("checkIn").value, checkOut=$("checkOut").value;
 if(!checkIn||!checkOut||checkOut<=checkIn){message("Please choose a check-out date after your check-in date.",true);return;}
 const button=$("submitBooking");button.disabled=true;button.textContent="Sending request…";
 const payload={room_id:$("roomId").value,check_in:checkIn,check_out:checkOut,adults:Number($("adults").value),children:Number($("children").value),guest_name:$("guestName").value.trim(),guest_email:$("guestEmail").value.trim(),guest_phone:$("guestPhone").value.trim(),special_requests:$("requests").value.trim()||null};
 try{
  const {data,error}=await db.from("fs_bookings").insert(payload).select("booking_reference").single();
  if(error) throw error;
  message("Your request was received. Reference: "+data.booking_reference+". This is not a confirmed reservation; hotel management must confirm availability.");
  $("bookingForm").reset();$("checkIn").min=today.toISOString().slice(0,10);
 }catch(err){console.error(err);message(err.message?.includes("capacity")?"The selected room may not accommodate the guest count. Please adjust your selection or contact the hotel.":"We couldn't submit your request just now. Please check your details or contact the hotel directly.",true);}
 finally{button.disabled=false;button.innerHTML='Send booking request <span>→</span>';}
});
loadRooms();