const RSVP_SESSION_KEY="weddingRsvpSession";
const signupForm=document.querySelector("#signupForm"),signupStatus=document.querySelector("#signupStatus"),signupButton=document.querySelector("#signupSubmit");
signupForm.onsubmit=signup;
redirectExistingSession();

async function signup(event){event.preventDefault();signupButton.disabled=true;signupStatus.textContent="Creating account…";try{const config=await getConfig();const response=await fetch(`${config.supabaseUrl}/auth/v1/signup`,{method:"POST",headers:{apikey:config.anonKey,"Content-Type":"application/json"},body:JSON.stringify({email:document.querySelector("#email").value.trim(),password:document.querySelector("#password").value})});const result=await response.json();if(!response.ok)throw new Error(result.error_description||result.msg||result.message||"Unable to create account.");if(!result.access_token){signupStatus.textContent="Account created. Check your email to confirm it, then log in.";return}localStorage.setItem(RSVP_SESSION_KEY,JSON.stringify(result));window.location.replace("rsvp.html")}catch(error){signupStatus.textContent=error.message}finally{signupButton.disabled=false}}

function redirectExistingSession(){if(localStorage.getItem(RSVP_SESSION_KEY))window.location.replace("rsvp.html")}

async function getConfig(){if(window.WEDDING_CONFIG?.supabaseUrl&&window.WEDDING_CONFIG?.anonKey)return window.WEDDING_CONFIG;const response=await fetch("/api/upload-config",{cache:"no-store"});const value=await response.json();if(!response.ok)throw new Error(value.error||"Account creation is not configured.");return value}
