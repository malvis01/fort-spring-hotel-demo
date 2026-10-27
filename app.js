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

// Restaurant and bar ordering. The server-side RPC calculates totals from current menu prices.
const orderCart = new Map();
let menuItems = [];
let activeMenuFilter = "all";
function orderMessage(text,error=false){$("foodOrderMessage").textContent=text;$("foodOrderMessage").classList.toggle("error",error);}
function renderMenu(){
 const visible = menuItems.filter(item => activeMenuFilter === "all" || item.category === activeMenuFilter);
 const grid = $("menuGrid");
 if(!visible.length){grid.innerHTML='<div class="menu-empty">No published items in this category yet. Please check back or ask hotel staff for the current menu.</div>';return;}
 grid.innerHTML=visible.map(item=>'<article class="menu-card"><div class="menu-photo" '+(item.image_url?'style="background-image:url(\''+escapeHTML(item.image_url)+'\');background-size:cover;background-position:center"':'')+'><span>'+escapeHTML(item.category)+'</span></div><div class="menu-card-body"><h3>'+escapeHTML(item.name)+'</h3><p>'+escapeHTML(item.description||"Ask our team for details.")+'</p><div class="menu-card-bottom"><strong>'+money(item.price)+'</strong><button class="small-link" type="button" data-add-menu="'+escapeHTML(item.id)+'">+ Add to order</button></div></div></article>').join("");
 grid.querySelectorAll("[data-add-menu]").forEach(button=>button.addEventListener("click",()=>addToCart(button.dataset.addMenu)));
}
function addToCart(id){
 const item=menuItems.find(m=>m.id===id);if(!item)return;
 const existing=orderCart.get(id);
 if(existing){if(existing.quantity>=20){orderMessage("Maximum quantity per item is 20.",true);return;}existing.quantity++;}
 else orderCart.set(id,{item,quantity:1});
 renderCart();orderMessage("");
}
function renderCart(){
 const lines=$("cartLines");const items=[...orderCart.values()];
 $("cartSummary").textContent=items.length ? items.reduce((n,x)=>n+x.quantity,0)+" item(s) in your basket" : "Your basket is empty.";
 if(!items.length){lines.innerHTML='<p class="cart-empty">Add something from the menu to begin.</p>';$("cartTotal").textContent=money(0);return;}
 lines.innerHTML=items.map(({item,quantity})=>'<div class="cart-line"><div><strong>'+escapeHTML(item.name)+'</strong><small>'+money(item.price)+' each</small></div><div class="cart-controls"><button type="button" aria-label="Decrease '+escapeHTML(item.name)+'" data-cart-minus="'+escapeHTML(item.id)+'">−</button><span>'+quantity+'</span><button type="button" aria-label="Increase '+escapeHTML(item.name)+'" data-cart-plus="'+escapeHTML(item.id)+'">+</button><button type="button" class="cart-remove" aria-label="Remove '+escapeHTML(item.name)+'" data-cart-remove="'+escapeHTML(item.id)+'">×</button></div></div>').join("");
 const total=items.reduce((n,x)=>n+Number(x.item.price)*x.quantity,0);$("cartTotal").textContent=money(total);
 lines.querySelectorAll("[data-cart-minus]").forEach(b=>b.addEventListener("click",()=>changeCart(b.dataset.cartMinus,-1)));
 lines.querySelectorAll("[data-cart-plus]").forEach(b=>b.addEventListener("click",()=>changeCart(b.dataset.cartPlus,1)));
 lines.querySelectorAll("[data-cart-remove]").forEach(b=>b.addEventListener("click",()=>{orderCart.delete(b.dataset.cartRemove);renderCart();}));
}
function changeCart(id,delta){const entry=orderCart.get(id);if(!entry)return;entry.quantity+=delta;if(entry.quantity<1)orderCart.delete(id);else if(entry.quantity>20)entry.quantity=20;renderCart();}
document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{activeMenuFilter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b===button));renderMenu();}));
$("serviceType").addEventListener("change",()=>{const isRoom=$("serviceType").value==="room_delivery";$("roomNumberWrap").classList.toggle("hidden-field",!isRoom);$("orderRoomNumber").required=isRoom;$("tableNumberWrap").classList.toggle("hidden-field",$("serviceType").value!=="restaurant");});
async function loadMenu(){
 if(!db)return;
 const {data,error}=await db.from("fs_restaurant_menu").select("id,name,description,category,price,image_url,is_available,sort_order").eq("is_available",true).order("sort_order");
 if(error){console.warn("Menu could not load:",error.message);return;}
 menuItems=data||[];renderMenu();
}
$("foodOrderForm").addEventListener("submit",async event=>{
 event.preventDefault();orderMessage("");
 if(!db){orderMessage("Online ordering is not connected yet. Please ask hotel staff to place your order.",true);return;}
 if(!orderCart.size){orderMessage("Please add at least one menu item.",true);return;}
 const serviceType=$("serviceType").value;
 if(serviceType==="room_delivery"&&!$("orderRoomNumber").value.trim()){orderMessage("Please enter your hotel room number.",true);return;}
 const button=$("submitFoodOrder");button.disabled=true;button.textContent="Sending order…";
 const payload={p_guest_name:$("orderGuestName").value.trim(),p_guest_phone:$("orderGuestPhone").value.trim(),p_guest_email:$("orderGuestEmail").value.trim()||null,p_service_type:serviceType,p_room_number:$("orderRoomNumber").value.trim()||null,p_table_number:$("orderTableNumber").value.trim()||null,p_delivery_notes:$("orderDeliveryNotes").value.trim()||null,p_special_instructions:$("orderSpecialRequests").value.trim()||null,p_items:[...orderCart.values()].map(x=>({menu_item_id:x.item.id,quantity:x.quantity}))};
 try{
  const {data,error}=await db.rpc("fs_place_food_order",payload);
  if(error)throw error;
  const result=Array.isArray(data)?data[0]:data;
  orderMessage("Order request sent successfully. Reference: "+result.order_reference+". Estimated total: "+money(result.total)+". Hotel staff must accept the order and confirm availability.");
  orderCart.clear();renderCart();$("foodOrderForm").reset();$("roomNumberWrap").classList.add("hidden-field");$("orderRoomNumber").required=false;
 }catch(err){console.error(err);orderMessage(err.message?.includes("no longer available")?"One of the items is no longer available. Please refresh the menu and try again.":"We couldn't send this order. Please check your details or ask hotel staff for help.",true);}
 finally{button.disabled=false;button.innerHTML='Send order request <span>→</span>';}
});
loadMenu();renderCart();
