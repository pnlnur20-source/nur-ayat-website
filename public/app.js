import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// Paste the Firebase web-app config from Project settings > Your apps.
const firebaseConfig = {
  apiKey: "AIzaSyDOrMQnyNPHrm1xArxXmpOfZ3Yj2Le9hjU",
  authDomain: "nurayatweb.firebaseapp.com",
  projectId: "nurayatweb",
  storageBucket: "nurayatweb.firebasestorage.app",
  messagingSenderId: "792356463461",
  appId: "1:792356463461:web:352d9206dc909cae69f78c",
  measurementId: "G-8N47TWNSCH"
};
// Must match the UID used in firestore.rules and storage.rules.
const ADMIN_UID = "rpjasSyCySM5jMgnemXrXLuQS2k1";

const $ = id => document.getElementById(id);
const status = msg => $("status").textContent = msg;
const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app), storage = getStorage(app);
const start = new Date(2026,9,8,0,0,0);
function tick(){let d=Math.max(0,Date.now()-start.getTime());$("days").textContent=Math.floor(d/86400000);$("hours").textContent=String(Math.floor(d/3600000)%24).padStart(2,"0");$("minutes").textContent=String(Math.floor(d/60000)%60).padStart(2,"0");$("seconds").textContent=String(Math.floor(d/1000)%60).padStart(2,"0");}
tick();setInterval(tick,1000);$("year").textContent=new Date().getFullYear();

$("showAdmin").onclick=()=>{$("adminArea").classList.toggle("open");$("adminArea").scrollIntoView({behavior:"smooth"});};
$("login").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);status("Signed in.");}catch(e){status("Login failed: "+e.message);}};
$("logout").onclick=()=>signOut(auth);
onAuthStateChanged(auth,user=>{
 const isAdmin=!!user && user.uid===ADMIN_UID;
 $("loginBox").style.display=isAdmin?"none":"block";
 $("adminTools").style.display=isAdmin?"block":"none";
 $("logout").style.display=isAdmin?"inline-block":"none";
 if(user&&!isAdmin){status("This account is not authorized as the site admin.");signOut(auth);}
 else if(!user)status("Sign in with the admin account to manage the site.");
});

function safeText(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
onSnapshot(collection(db,"photos"),snap=>{
 const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 $("photos").innerHTML=items.length?items.map(x=>`<article class="photo"><img src="${safeText(x.url)}" alt="${safeText(x.caption||"Our memory")}"><p>${safeText(x.caption||"A memory")}</p></article>`).join(""):'<div class="empty">No photos yet — add your first memory from Admin.</div>';
 renderManage();
},e=>{$("photos").innerHTML='<div class="empty">Could not load photos. Check Firebase setup and rules.</div>';});
onSnapshot(collection(db,"tracks"),snap=>{
 const items=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 $("tracks").innerHTML=items.length?items.map(x=>`<div class="track"><span class="disc">♫</span><strong>${safeText(x.title||"Untitled song")}</strong><audio controls preload="none" src="${safeText(x.url)}"></audio></div>`).join(""):'<div class="empty">No songs yet — add a romantic song from Admin.</div>';
 renderManage();
},e=>{$("tracks").innerHTML='<div class="empty">Could not load songs. Check Firebase setup and rules.</div>';});
let photoItems=[],trackItems=[];
function renderManage(){
 if(!$("manageList"))return;
 const photoCards=photoItems.map(x=>`<div class="actions" style="justify-content:space-between;margin:8px 0"><span>📷 ${safeText(x.caption||"Photo")}</span><button class="danger" data-kind="photos" data-id="${x.id}" data-path="${safeText(x.storagePath)}">Delete</button></div>`).join("");
 const trackCards=trackItems.map(x=>`<div class="actions" style="justify-content:space-between;margin:8px 0"><span>🎵 ${safeText(x.title||"Song")}</span><button class="danger" data-kind="tracks" data-id="${x.id}" data-path="${safeText(x.storagePath)}">Delete</button></div>`).join("");
 $("manageList").innerHTML=(photoCards+trackCards)||'<p class="intro">Nothing uploaded yet.</p>';
}
onSnapshot(collection(db,"photos"),s=>{photoItems=s.docs.map(d=>({id:d.id,...d.data()}));renderManage();});
onSnapshot(collection(db,"tracks"),s=>{trackItems=s.docs.map(d=>({id:d.id,...d.data()}));renderManage();});
$("manageList").addEventListener("click",async e=>{
 const b=e.target.closest("button[data-kind]");if(!b)return;
 if(!auth.currentUser||auth.currentUser.uid!==ADMIN_UID)return status("Admin access required.");
 try{await deleteDoc(doc(db,b.dataset.kind,b.dataset.id));if(b.dataset.path)await deleteObject(ref(storage,b.dataset.path));status("Removed from the shared website.");}catch(err){status("Delete failed: "+err.message);}
});
async function upload(kind,file,title){
 if(!auth.currentUser||auth.currentUser.uid!==ADMIN_UID)throw new Error("Admin access required.");
 if(!file)throw new Error("Choose a file first.");
 const max=kind==="photos"?10*1024*1024:30*1024*1024;
 if(file.size>max)throw new Error("File is too large. Limit: "+(kind==="photos"?"10 MB":"30 MB")+".");
 const folder=kind==="photos"?"photos":"tracks",path=`${folder}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
 const storageRef=ref(storage,path);await uploadBytes(storageRef,file,{contentType:file.type});const url=await getDownloadURL(storageRef);
 await addDoc(collection(db,kind),{url,storagePath:path,[kind==="photos"?"caption":"title"]:title||file.name,contentType:file.type,createdAt:serverTimestamp()});
}
$("uploadPhoto").onclick=async()=>{try{status("Uploading photo…");await upload("photos",$("photoFile").files[0],$("photoCaption").value.trim());$("photoFile").value="";$("photoCaption").value="";status("Photo uploaded — everyone can see it now.");}catch(e){status(e.message);}};
$("uploadAudio").onclick=async()=>{try{status("Uploading song…");await upload("tracks",$("audioFile").files[0],$("songTitle").value.trim());$("audioFile").value="";$("songTitle").value="";status("Song uploaded — everyone can play it now.");}catch(e){status(e.message);}};

function templateDoc(){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${$("templateCss").value.replace(/<\/style/gi,"<\\/style")}</style></head><body>${$("templateHtml").value}<script>${$("templateJs").value.replace(/<\/script/gi,"<\\/script")}</script></body></html>`;}
$("previewTemplate").onclick=()=>{$("adminPreview").srcdoc=templateDoc();status("Template preview refreshed.");};
$("publishTemplate").onclick=async()=>{try{if(!auth.currentUser||auth.currentUser.uid!==ADMIN_UID)throw new Error("Admin access required.");await setDoc(doc(db,"site","publishedTemplate"),{title:$("templateTitle").value.trim()||"Our template",html:$("templateHtml").value,css:$("templateCss").value,js:$("templateJs").value,updatedAt:serverTimestamp()});status("Template published. Visitors will see it live.");}catch(e){status("Publish failed: "+e.message);}};
onSnapshot(doc(db,"site","publishedTemplate"),snap=>{
 const t=snap.data();if(!t){$("publishedTemplate").style.display="none";return;}
 $("publishedTemplate").style.display="block";
 const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${String(t.css||"").replace(/<\/style/gi,"<\\/style")}</style></head><body>${t.html||""}<script>${String(t.js||"").replace(/<\/script/gi,"<\\/script")}</script></body></html>`;
 $("publicTemplate").srcdoc=html;
});
