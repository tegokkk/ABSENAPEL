"use strict";

/* =========================================================
   DATA MODEL
   ========================================================= */
const defaultSchemas = () => ([
  { nama:"User", kolom:[
    {nama:"id",tipe:"INT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"username",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"password",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"role",tipe:"VARCHAR(50)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"name",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"npm",tipe:"VARCHAR(50)",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"kelas",tipe:"VARCHAR(50)",isPK:false,isNotNull:false,refTable:"",refCol:""}]},
  { nama:"LokasiAbsen", kolom:[
    {nama:"id",tipe:"INT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"nama_lokasi",tipe:"VARCHAR(255)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"latitude",tipe:"DOUBLE",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"longitude",tipe:"DOUBLE",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"radius_meter",tipe:"DOUBLE",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"is_active",tipe:"BOOLEAN",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"is_default",tipe:"BOOLEAN",isPK:false,isNotNull:true,refTable:"",refCol:""}]},
  { nama:"Attendance", kolom:[
    {nama:"id_absensi",tipe:"INT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"userId",tipe:"INT",isPK:false,isNotNull:true,refTable:"User",refCol:"id"},
    {nama:"tanggal",tipe:"TIMESTAMP",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"jam_absen",tipe:"TIMESTAMP",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"status",tipe:"VARCHAR(50)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"latitude",tipe:"DOUBLE",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"longitude",tipe:"DOUBLE",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"alamat_lokasi",tipe:"TEXT",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"device_info",tipe:"TEXT",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"ip_address",tipe:"VARCHAR(50)",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"foto_selfie",tipe:"TEXT",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"accuracy",tipe:"DOUBLE",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"gps_timestamp",tipe:"DOUBLE",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"jarak_dari_titik",tipe:"DOUBLE",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"browser",tipe:"VARCHAR(100)",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"platform",tipe:"VARCHAR(100)",isPK:false,isNotNull:false,refTable:"",refCol:""},
    {nama:"nama_lokasi_aktif",tipe:"VARCHAR(255)",isPK:false,isNotNull:false,refTable:"",refCol:""}]},
  { nama:"Settings", kolom:[
    {nama:"id",tipe:"INT",isPK:true,isNotNull:true,refTable:"",refCol:""},
    {nama:"key",tipe:"VARCHAR(100)",isPK:false,isNotNull:true,refTable:"",refCol:""},
    {nama:"value",tipe:"TEXT",isPK:false,isNotNull:true,refTable:"",refCol:""}]}
]);
const defaultTestCases = () => ([
  {id:1,skenario:"Login Mahasiswa dengan NPM",hasilDiharapkan:"Sistem berhasil mengautentikasi dan mengarahkan ke Dashboard Mahasiswa.",status:"Berhasil",buktiGambar:[]},
  {id:2,skenario:"Absen Apel Pagi di Luar Radius Aktif",hasilDiharapkan:"Sistem mendeteksi jarak melebihi batas radius, menampilkan pesan error, dan menolak absensi.",status:"Berhasil",buktiGambar:[]},
  {id:3,skenario:"Absen Apel Pagi di Dalam Radius Aktif",hasilDiharapkan:"Sistem menerima koordinat dan foto selfie, menghitung jarak, lalu menyimpan status kehadiran (HADIR/TERLAMBAT).",status:"Berhasil",buktiGambar:[]},
  {id:4,skenario:"Admin Menambah dan Mengaktifkan Lokasi Apel Baru",hasilDiharapkan:"Lokasi baru berhasil disimpan, dan setelah diaktifkan, menjadi acuan koordinat absensi mahasiswa.",status:"Berhasil",buktiGambar:[]},
  {id:5,skenario:"Admin Melakukan CRUD Mahasiswa",hasilDiharapkan:"Admin dapat menambah, mengedit data kelas, dan menghapus mahasiswa beserta riwayat absensinya.",status:"Berhasil",buktiGambar:[]}
]);

let schemas = defaultSchemas();
let mockupImages = [];
let screenshotImages = [];
let testCases = defaultTestCases();
let nextTestCaseId = 6;

const STORE_KEY = "rndSQL2_final_v2";

/* =========================================================
   UTIL
   ========================================================= */
function escapeHtml(s){
  if(s===undefined||s===null) return '';
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
const $ = id => document.getElementById(id);

/* =========================================================
   PENYIMPANAN — IndexedDB (kuota besar) + kompres gambar
   Antisipasi "memory full": gambar dikompres, data utama di
   IndexedDB (bukan localStorage 5MB), localStorage hanya
   cadangan teks ringan.
   ========================================================= */
const IDB_NAME = "rndSQL2DB";
const IDB_STORE = "doc";
const IMG_MAX_SIZE = 1200;   // px sisi terpanjang
const IMG_QUALITY = 0.72;    // kualitas JPEG

function idbOpen(){
  return new Promise((res,rej)=>{
    if(!window.indexedDB){ rej(new Error("IndexedDB tidak tersedia")); return; }
    const req = indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded = ()=>{ req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = ()=>res(req.result);
    req.onerror = ()=>rej(req.error);
  });
}
function idbSet(key,val){
  return idbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readwrite");
    tx.objectStore(IDB_STORE).put(val,key);
    tx.oncomplete=()=>res(true);
    tx.onerror=()=>rej(tx.error);
  }));
}
function idbGet(key){
  return idbOpen().then(db=>new Promise((res,rej)=>{
    const tx=db.transaction(IDB_STORE,"readonly");
    const r=tx.objectStore(IDB_STORE).get(key);
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  }));
}

/* Kompres + resize gambar sebelum disimpan (mengembalikan dataURL JPEG) */
function compressImage(file){
  return new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        let {width:w,height:h}=img;
        if(w>h && w>IMG_MAX_SIZE){ h=Math.round(h*IMG_MAX_SIZE/w); w=IMG_MAX_SIZE; }
        else if(h>=w && h>IMG_MAX_SIZE){ w=Math.round(w*IMG_MAX_SIZE/h); h=IMG_MAX_SIZE; }
        const cv=document.createElement("canvas");
        cv.width=w; cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        try{ resolve(cv.toDataURL("image/jpeg",IMG_QUALITY)); }
        catch(e){ resolve(ev.target.result); } // fallback bila gambar CORS/SVG
      };
      img.onerror=()=>resolve(ev.target.result);
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Tampilkan pemakaian penyimpanan di bar atas */
function updateStorageMeter(){
  const el=$("storageMeter"); if(!el) return;
  if(navigator.storage && navigator.storage.estimate){
    navigator.storage.estimate().then(est=>{
      const usedMB=(est.usage||0)/1048576;
      const quotaMB=(est.quota||0)/1048576;
      el.textContent=`DB: ${usedMB.toFixed(1)} MB`;
      el.classList.remove("warn","full");
      if(quotaMB>0){
        const ratio=usedMB/quotaMB;
        if(ratio>0.9) el.classList.add("full");
        else if(ratio>0.7) el.classList.add("warn");
      }
    }).catch(()=>{ el.textContent="DB: ok"; });
  } else { el.textContent="DB: ok"; }
}

/* =========================================================
   DAFTAR ISI (auto)  — pakai angka romawi
   ========================================================= */
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
function buildTOC(){
  const list = $("tocList");
  const secs = document.querySelectorAll(".section[data-toc]");
  let html = "";
  secs.forEach((s,i)=>{
    const label = s.getAttribute("data-toc");
    html += `<li><a href="#${s.id}"><span class="roman">${ROMAN[i]||(i+1)}.</span> <span>${label}</span><span class="leader"></span></a></li>`;
  });
  list.innerHTML = html;
}

/* =========================================================
   SCHEMA BUILDER
   ========================================================= */
function renderDynamicTables(){
  const container = $("daftarTabelDinamis");
  if(!container) return;
  let html = "";
  schemas.forEach((tbl,idxT)=>{
    html += `<div class="schema-row">
      <div class="row-top">
        <input type="text" class="input" style="max-width:260px;font-weight:700;" value="${escapeHtml(tbl.nama)}" onchange="updateNamaTabel(${idxT},this.value)">
        <button class="btn btn-sm btn-danger no-print" onclick="hapusTabelFunc(${idxT})">Hapus Tabel</button>
      </div>
      <div class="table-scroll"><table class="tbl"><thead><tr>
        <th>Kolom</th><th>Tipe Data</th><th class="ck">PK</th><th class="ck">Not Null</th><th>Foreign Key</th><th class="ck no-print">Aksi</th>
      </tr></thead><tbody>`;
    tbl.kolom.forEach((kol,idxK)=>{
      html += `<tr>
        <td><input class="input" value="${escapeHtml(kol.nama)}" onchange="updateKolomFunc(${idxT},${idxK},'nama',this.value)"></td>
        <td><input class="input" value="${escapeHtml(kol.tipe)}" onchange="updateKolomFunc(${idxT},${idxK},'tipe',this.value)"></td>
        <td class="ck"><input type="checkbox" ${kol.isPK?"checked":""} onchange="updateKolomFunc(${idxT},${idxK},'isPK',this.checked)"></td>
        <td class="ck"><input type="checkbox" ${kol.isNotNull?"checked":""} onchange="updateKolomFunc(${idxT},${idxK},'isNotNull',this.checked)"></td>
        <td><select class="input" onchange="updateFKFunc(${idxT},${idxK},this.value)">${generateFkOptions(tbl.nama,kol.refTable,kol.refCol)}</select></td>
        <td class="ck no-print"><button class="btn btn-sm btn-danger" onclick="hapusKolomFunc(${idxT},${idxK})">X</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>
      <button class="btn btn-sm btn-light no-print" style="margin-top:10px;" onclick="tambahKolomFunc(${idxT})">+ Tambah Kolom</button>
    </div>`;
  });
  container.innerHTML = html;
  generateSQLAndPreview();
  renderDataDictionary();
}

function generateFkOptions(currentTable,curRefTable,curRefCol){
  let opts = `<option value="">— Tanpa FK —</option>`;
  schemas.forEach(t=>{
    if(t.nama===currentTable) return;
    t.kolom.forEach(k=>{
      if(k.isPK){
        const val = `${t.nama}.${k.nama}`;
        const sel = (curRefTable===t.nama&&curRefCol===k.nama)?"selected":"";
        opts += `<option value="${escapeHtml(val)}" ${sel}>${escapeHtml(val)}</option>`;
      }
    });
  });
  return opts;
}

window.updateNamaTabel=(i,v)=>{if(schemas[i])schemas[i].nama=v;renderDynamicTables();};
window.hapusTabelFunc=(i)=>{schemas.splice(i,1);renderDynamicTables();};
window.tambahKolomFunc=(i)=>{schemas[i].kolom.push({nama:"kolom_baru",tipe:"VARCHAR(100)",isPK:false,isNotNull:false,refTable:"",refCol:""});renderDynamicTables();};
window.hapusKolomFunc=(t,k)=>{schemas[t].kolom.splice(k,1);renderDynamicTables();};
window.updateKolomFunc=(t,k,f,v)=>{schemas[t].kolom[k][f]=v;renderDynamicTables();};
window.updateFKFunc=(t,k,v)=>{
  if(!v){schemas[t].kolom[k].refTable="";schemas[t].kolom[k].refCol="";}
  else{const[rt,rc]=v.split('.');schemas[t].kolom[k].refTable=rt;schemas[t].kolom[k].refCol=rc;}
  renderDynamicTables();
};

function generateSQLAndPreview(){
  let ddl="",rel="";
  schemas.forEach(t=>{
    ddl += `CREATE TABLE ${t.nama} (\n`;
    const cols=[];
    t.kolom.forEach(k=>{
      let line=`  ${k.nama} ${k.tipe}`;
      if(k.isNotNull) line+=" NOT NULL";
      if(k.isPK) line+=" PRIMARY KEY";
      cols.push(line);
    });
    t.kolom.forEach(k=>{
      if(k.refTable&&k.refCol){
        cols.push(`  FOREIGN KEY (${k.nama}) REFERENCES ${k.refTable}(${k.refCol})`);
        rel += `- ${t.nama}.${k.nama} -> ${k.refTable}.${k.refCol}\n`;
      }
    });
    ddl += cols.join(",\n")+"\n);\n\n";
  });
  $("previewDDL").textContent = ddl || "-- belum ada tabel";
  $("previewRelasi").textContent = rel || "-- tidak ada foreign key";
  $("lampiranSQL").value = `-- DDL\n${ddl}-- DML (isi data contoh di sini)\n`;
}

function renderDataDictionary(){
  const body = $("dataDictionary").querySelector("tbody");
  let html = `<tr><th>Tabel</th><th>Kolom</th><th>Tipe</th><th>Keterangan</th></tr>`;
  schemas.forEach(t=>{
    t.kolom.forEach(k=>{
      const ket=[];
      if(k.isPK) ket.push("Primary Key");
      if(k.isNotNull) ket.push("Wajib diisi");
      if(k.refTable) ket.push(`FK -> ${k.refTable}.${k.refCol}`);
      html += `<tr><td>${escapeHtml(t.nama)}</td><td>${escapeHtml(k.nama)}</td><td>${escapeHtml(k.tipe)}</td><td>${ket.join(", ")||"-"}</td></tr>`;
    });
  });
  body.innerHTML = html;
}

/* =========================================================
   TEST CASES
   ========================================================= */
function badgeFor(status){
  if(status==="Gagal") return '<span class="badge badge-fail">Gagal</span>';
  if(status==="Perbaikan") return '<span class="badge badge-fix">Perbaikan</span>';
  return '<span class="badge badge-ok">Berhasil</span>';
}
function renderTestCases(){
  const container=$("testCasesContainer");
  if(!container)return;
  let html="";
  testCases.forEach((tc,idx)=>{
    html += `<div class="tc-item">
      <div class="tc-grid">
        <div><label class="fld">Skenario Uji</label><input class="input" value="${escapeHtml(tc.skenario)}" onchange="updateTestCase(${idx},'skenario',this.value)"></div>
        <div><label class="fld">Hasil Diharapkan</label><input class="input" value="${escapeHtml(tc.hasilDiharapkan)}" onchange="updateTestCase(${idx},'hasilDiharapkan',this.value)"></div>
        <div><label class="fld">Status</label>
          <select class="input" onchange="updateTestCase(${idx},'status',this.value)">
            <option ${tc.status==='Berhasil'?'selected':''}>Berhasil</option>
            <option ${tc.status==='Gagal'?'selected':''}>Gagal</option>
            <option ${tc.status==='Perbaikan'?'selected':''}>Perbaikan</option>
          </select>
        </div>
        <div class="no-print"><button class="btn btn-sm btn-danger" onclick="hapusTestCase(${idx})">Hapus</button></div>
      </div>
      <div class="tc-bukti">
        <label class="fld">Bukti Screenshot ${badgeFor(tc.status)}</label>
        <div class="tc-thumbs" id="buktiGallery_${tc.id}"></div>
        <button type="button" class="btn btn-sm btn-light no-print" style="margin-top:8px;" onclick="tambahBuktiUji(${tc.id})">Upload Bukti</button>
      </div>
    </div>`;
  });
  container.innerHTML=html;
  testCases.forEach(tc=>{
    const g=$(`buktiGallery_${tc.id}`);
    if(!g)return;
    let h="";
    tc.buktiGambar.forEach((img,i)=>{
      h += `<div class="tc-thumb">
        <img src="${escapeHtml(img.src)}" alt="bukti">
        <input class="input" style="margin-top:6px;font-size:12px;" placeholder="Keterangan" value="${escapeHtml(img.caption)}" onchange="updateBuktiKeterangan(${tc.id},${i},this.value)">
        <button class="btn btn-sm btn-danger no-print" style="margin-top:6px;width:100%;" onclick="hapusBuktiUji(${tc.id},${i})">Hapus</button>
      </div>`;
    });
    g.innerHTML = h || '<span class="gallery-empty">Belum ada bukti. Klik "Upload Bukti".</span>';
  });
  updateProgress();
}
window.updateTestCase=(i,f,v)=>{if(testCases[i])testCases[i][f]=v;renderTestCases();};
window.hapusTestCase=(i)=>{testCases.splice(i,1);renderTestCases();};
window.tambahBuktiUji=(id)=>{
  const fi=document.createElement('input');fi.type='file';fi.accept='image/*';
  fi.onchange=e=>{const f=e.target.files[0];if(!f)return;
    compressImage(f).then(src=>{const tc=testCases.find(t=>t.id===id);if(tc){tc.buktiGambar.push({src,caption:'Bukti: '+tc.skenario});renderTestCases();}});};
  fi.click();
};
window.hapusBuktiUji=(id,i)=>{const tc=testCases.find(t=>t.id===id);if(tc){tc.buktiGambar.splice(i,1);renderTestCases();}};
window.updateBuktiKeterangan=(id,i,v)=>{const tc=testCases.find(t=>t.id===id);if(tc&&tc.buktiGambar[i]){tc.buktiGambar[i].caption=v;}};

/* =========================================================
   GALLERIES (mockup & screenshot)
   ========================================================= */
function renderGallery(containerId,arr){
  const c=$(containerId);if(!c)return;
  let h="";
  arr.forEach((item,idx)=>{
    h += `<div class="gallery-item">
      <img src="${escapeHtml(item.src)}" alt="gambar">
      <input class="input" style="margin-top:8px;font-size:13px;" placeholder="Keterangan gambar..." value="${escapeHtml(item.caption)}" onchange="updateGalleryCaption('${containerId}',${idx},this.value)">
      <button class="btn btn-sm btn-danger no-print" style="margin-top:8px;width:100%;" onclick="removeGalleryImage('${containerId}',${idx})">Hapus</button>
    </div>`;
  });
  c.innerHTML = h || '<span class="gallery-empty">Belum ada gambar.</span>';
}
function arrFor(containerId){return containerId==='mockupGalleryContainer'?mockupImages:screenshotImages;}
window.updateGalleryCaption=(cid,idx,v)=>{const a=arrFor(cid);if(a[idx])a[idx].caption=v;};
window.removeGalleryImage=(cid,idx)=>{const a=arrFor(cid);a.splice(idx,1);renderGallery(cid,a);};
function addImageToGallery(type){
  const cid = type==='mockup'?'mockupGalleryContainer':'screenshotGalleryContainer';
  const arr = arrFor(cid);
  const fi=document.createElement('input');fi.type='file';fi.accept='image/*';
  fi.onchange=e=>{const f=e.target.files[0];if(!f)return;
    compressImage(f).then(src=>{arr.push({src,caption:type==='mockup'?'Desain antarmuka':'Tampilan aplikasi'});renderGallery(cid,arr);});};
  fi.click();
}

/* =========================================================
   PRINT MIRROR — ubah input jadi teks dokumen formal
   ========================================================= */
function syncPrintMirrors(){
  document.querySelectorAll("#rndDocument input[id], #rndDocument textarea[id], #rndDocument select[id]").forEach(el=>{
    if(el.type==="checkbox"||el.type==="file") return;
    let m = el.nextElementSibling;
    if(!m || !m.classList || !m.classList.contains("print-mirror")){
      m = document.createElement("div");
      m.className="print-mirror";
      el.parentNode.insertBefore(m, el.nextSibling);
    }
    const val = (el.value||"").trim();
    m.textContent = val || "—";
  });
}

/* =========================================================
   PERSISTENCE
   ========================================================= */
function collectFormData(){
  const data={};
  document.querySelectorAll("#rndDocument input, #rndDocument textarea, #rndDocument select").forEach(el=>{
    if(el.id) data[el.id]=el.value;
  });
  data.__schemas=schemas;
  data.__mockup=mockupImages;
  data.__screenshot=screenshotImages;
  data.__testCases=testCases;
  data.__nextTestCaseId=nextTestCaseId;
  return data;
}
/* Cadangan teks-saja (tanpa gambar) ke localStorage — selalu kecil & aman */
function saveTextFallback(data){
  try{
    const lite={...data};
    lite.__mockup=[]; lite.__screenshot=[];
    lite.__testCases=(data.__testCases||[]).map(tc=>({...tc,buktiGambar:[]}));
    localStorage.setItem(STORE_KEY, JSON.stringify(lite));
  }catch(e){ /* abaikan, IDB yang utama */ }
}

function applyData(d){
  if(Array.isArray(d.__schemas)) schemas=d.__schemas;
  if(Array.isArray(d.__mockup)) mockupImages=d.__mockup;
  if(Array.isArray(d.__screenshot)) screenshotImages=d.__screenshot;
  if(Array.isArray(d.__testCases)) testCases=d.__testCases;
  if(d.__nextTestCaseId) nextTestCaseId=d.__nextTestCaseId;
  for(const k in d){
    if(k.startsWith("__")) continue;
    const el=$(k); if(el) el.value=d[k];
  }
}
function renderAll(){
  renderDynamicTables();
  renderGallery('mockupGalleryContainer',mockupImages);
  renderGallery('screenshotGalleryContainer',screenshotImages);
  renderTestCases();
  updateProgress();
}

function saveAllFormData(silent){
  const data=collectFormData();
  saveTextFallback(data); // teks selalu aman walau gambar gagal
  idbSet("main",data).then(()=>{
    updateStorageMeter();
    if(!silent) alert("Tersimpan. Semua data (termasuk gambar) tercatat di browser ini.");
  }).catch(err=>{
    console.warn("IDB simpan gagal:",err);
    updateStorageMeter();
    if(!silent) alert("Teks tersimpan, tetapi GAMBAR gagal disimpan (penyimpanan penuh).\n\nSaran: gunakan tombol Export untuk backup .json, atau kurangi/hapus gambar besar.");
  });
}

function loadAllFormData(){
  idbGet("main").then(d=>{
    if(d){ applyData(d); renderAll(); updateStorageMeter(); return; }
    // migrasi dari localStorage lama bila ada
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){ try{ applyData(JSON.parse(raw)); }catch(e){ console.warn(e); } }
    renderAll(); updateStorageMeter();
  }).catch(()=>{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){ try{ applyData(JSON.parse(raw)); }catch(e){ console.warn(e); } }
    renderAll(); updateStorageMeter();
  });
}

/* ---------- EXPORT / IMPORT .json (backup portabel) ---------- */
function exportJSON(){
  const data=collectFormData();
  const nim=(data.nim||"mahasiswa").replace(/[^\w.-]/g,"_");
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`RND_SQL2_${nim}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function importJSON(file){
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      if(!confirm("Muat data dari file ini? Data saat ini akan tertimpa."))return;
      applyData(d); renderAll();
      saveAllFormData(true);
      alert("Data berhasil dimuat dari file .json.");
    }catch(e){ alert("File tidak valid / bukan backup RND yang benar."); }
  };
  r.readAsText(file);
}
function resetDefault(){
  if(!confirm("Yakin reset semua data ke kondisi kosong/default? Tindakan ini tidak bisa dibatalkan."))return;
  localStorage.removeItem(STORE_KEY);
  idbSet("main",null).catch(()=>{});
  schemas=defaultSchemas();mockupImages=[];screenshotImages=[];
  testCases=defaultTestCases();nextTestCaseId=5;
  document.querySelectorAll("#rndDocument input, #rndDocument textarea").forEach(el=>{
    if(el.type==='checkbox'||el.type==='file') return;
    el.value='';
  });
  $("institusi").value="Politeknik Negeri Lampung";
  renderDynamicTables();
  renderGallery('mockupGalleryContainer',mockupImages);
  renderGallery('screenshotGalleryContainer',screenshotImages);
  renderTestCases();
  updateProgress();
  updateStorageMeter();
  alert("Dokumen telah direset.");
}

/* =========================================================
   CONTOH (sample fill)
   ========================================================= */
function isiContoh(){
  if(!confirm("Isi field yang masih kosong dengan data contoh?"))return;
  const v={
    judulProyek: "Aplikasi Absensi Apel Mahasiswa Berbasis Geolocation dan Anti-Fake GPS (ABSEN-APEL)",
    namaMahasiswa: "(Nama Mahasiswa)",
    nim: "(NIM)",
    kelasSemester: "Manajemen Informatika",
    dosenPengampu: "(Dosen Pengampu)",
    tglMulai: "2026-02-10",
    tglSelesai: "2026-06-15",
    latarBelakang: "Pelaksanaan apel pagi mahasiswa Politeknik Negeri Lampung sering kali sulit dipantau secara efisien dan rawan kecurangan absensi (misalnya dengan menggunakan aplikasi Fake GPS). Aplikasi ABSEN-APEL dibangun untuk memverifikasi lokasi riil mahasiswa menggunakan teknologi GPS dengan perhitungan rumus Haversine serta pembatasan radius, serta dilengkapi verifikasi foto selfie untuk memastikan keaslian kehadiran.",
    rumusanMasalah: "1. Bagaimana merancang basis data relasional untuk mengelola data mahasiswa, lokasi apel, pengaturan waktu, dan transaksi absensi?\n2. Bagaimana mengimplementasikan verifikasi geolocation dan pembatasan radius absen dari titik koordinat apel?\n3. Bagaimana memastikan keamanan absensi dari penggunaan Fake GPS dan manipulasi waktu lokal perangkat?",
    tujuanProyek: "1. Membangun sistem absensi apel terpusat berbasis web (ABSEN-APEL) dengan arsitektur REST API.\n2. Mengimplementasikan basis data relasional (PostgreSQL) menggunakan Prisma ORM untuk menjamin integritas data.\n3. Menyediakan fitur validasi radius berbasis koordinat nyata (Haversine Formula) dan pencatatan parameter anti-fake GPS (akurasi, timestamp GPS, device platform).",
    lingkupDikerjakan: "1. Otentikasi & Autorisasi (JWT) untuk Admin dan Mahasiswa.\n2. Dashboard Mahasiswa dengan fitur deteksi lokasi riil, capture kamera selfie, verifikasi radius apel, dan submit absensi.\n3. Dashboard Admin dengan visualisasi statistik kehadiran harian per kelas, CRUD lokasi apel (mengaktifkan/menonaktifkan lokasi aktif), CRUD data mahasiswa, rekap & export absensi.",
    lingkupTidak: "1. Pengajuan izin sakit/izin tidak masuk secara resmi lewat sistem (dilakukan manual di luar aplikasi).\n2. Notifikasi absensi ke smartphone mahasiswa menggunakan Push Notification (hanya melalui web dashboard).\n3. Integrasi mesin sensor biometrik sidik jari fisik.",
    targetUser: "Mahasiswa Jurusan Teknologi Informasi Politeknik Negeri Lampung dan Admin Tim Kedisiplinan (TIMDIS)",
    manfaat: "Memudahkan Tim Kedisiplinan memantau kehadiran apel secara akurat dan otomatis, menekan tingkat kecurangan absensi dengan verifikasi koordinat riil dan foto selfie, serta mempermudah rekapitulasi data absensi bulanan.",
    techStackDetail: "Arsitektur: Client-Server berbasis REST API\n- Database: PostgreSQL (Supabase Cloud)\n- Backend: Node.js (Express.js) & Prisma ORM\n- Frontend: React.js (Vite), Tailwind CSS / Vanilla CSS\n- Keamanan & Validasi: JWT (JSON Web Token), bcrypt (hashing password), Haversine Distance Formula, Verifikasi Akurasi GPS (< 100 meter), validasi waktu server untuk status keterlambatan.",
    folderStructureDetail: "absen-apel/\n|-- backend/\n|   |-- prisma/\n|   |   |-- schema.prisma\n|   |   `-- migrations/\n|   |-- index.js\n|   |-- package.json\n|   `-- seed.js\n`-- frontend/\n    |-- src/\n    |   |-- pages/\n    |   |   |-- Login.jsx\n    |   |   |-- UserDashboard.jsx\n    |   |   `-- AdminDashboard.jsx\n    |   |-- App.jsx\n    |   |-- App.css\n    |   `-- main.jsx\n    |-- vite.config.js\n    `-- package.json",
    userFlow: "1. Pengguna membuka aplikasi dan melakukan login dengan kredensialnya.\n2. Jika rolenya MAHASISWA, ia diarahkan ke UserDashboard. Aplikasi meminta izin akses lokasi. Mahasiswa mengambil foto selfie dan menekan tombol 'Absen Apel'. Sistem memverifikasi koordinat terhadap lokasi aktif. Jika sukses, data terkirim.\n3. Jika rolenya ADMIN, ia diarahkan ke AdminDashboard. Admin dapat mengelola mahasiswa, mengelola lokasi apel, menentukan lokasi aktif, memantau statistik kehadiran hari ini, dan mengunduh/melihat laporan absensi.",
    routingTable: "POST   /api/login                     -> Login user/admin\nGET    /api/settings                  -> Ambil konfigurasi batas terlambat\nPUT    /api/settings                  -> Ubah konfigurasi batas terlambat (Admin)\nGET    /api/lokasi                    -> List lokasi apel\nPOST   /api/lokasi                    -> Tambah lokasi baru (Admin)\nPUT    /api/lokasi/:id                -> Edit lokasi (Admin)\nDELETE /api/lokasi/:id                -> Hapus lokasi (Admin)\nPUT    /api/lokasi/:id/activate       -> Set lokasi aktif (Admin)\nGET    /api/users                     -> List mahasiswa (Admin)\nPOST   /api/users                     -> Tambah mahasiswa (Admin)\nPUT    /api/users/:id                 -> Edit data mahasiswa (Admin)\nDELETE /api/users/:id                 -> Hapus mahasiswa (Admin)\nPOST   /api/attendance/apel           -> Absen apel pagi (Mahasiswa)\nGET    /api/attendance                -> Riwayat absensi\nDELETE /api/attendance/:id            -> Hapus data absensi (Admin)\nGET    /api/attendance/stats          -> Statistik harian kehadiran (Admin)",
    codeCreate: "// Implementasi Simpan Absensi Apel (backend/index.js)\nconst attendance = await prisma.attendance.create({\n  data: {\n    userId: req.user.id,\n    jam_absen: new Date(),\n    status: isLate ? \"TERLAMBAT\" : \"HADIR\",\n    latitude: lat,\n    longitude: lon,\n    alamat_lokasi: alamat_lokasi || null,\n    device_info: device_info || null,\n    ip_address: clientIP,\n    foto_selfie: fotoPath,\n    accuracy: acc,\n    gps_timestamp: gpsTs,\n    jarak_dari_titik: parseFloat(distance.toFixed(2)),\n    browser: browser || null,\n    platform: platform || null,\n    nama_lokasi_aktif: activeLocation.nama_lokasi,\n  },\n});",
    codeRead: "// Query Mengambil Riwayat Absensi dengan JOIN User (backend/index.js)\nconst records = await prisma.attendance.findMany({\n  where: filters,\n  include: {\n    user: {\n      select: { name: true, username: true, kelas: true, npm: true },\n    },\n  },\n  orderBy: { created_at: \"desc\" },\n});",
    codeUpdate: "// Query Mengupdate Data Mahasiswa (backend/index.js)\nconst user = await prisma.user.update({\n  where: { id: parseInt(id) },\n  data: {\n    name: name.trim(),\n    username: name.trim(),\n    npm: npm.trim(),\n    kelas: kelas\n  },\n});",
    codeDelete: "// Query Menghapus Data Absensi (backend/index.js)\nawait prisma.attendance.delete({\n  where: { id_absensi: parseInt(id) },\n});",
    metodeHosting: "VPS / Cloud",
    urlHosting: "https://absen-apel.vercel.app",
    langkahDeploy: "1. Buat database PostgreSQL di Supabase Cloud.\n2. Jalankan perintah migrasi prisma 'npx prisma migrate deploy' untuk membuat tabel di database Supabase.\n3. Jalankan 'node seed.js' untuk mengisi data awal admin (TIMDIS) dan mahasiswa contoh.\n4. Deploy backend Node.js ke Vercel dengan mengatur environment variable: DATABASE_URL, JWT_SECRET.\n5. Deploy frontend React (Vite) ke Vercel/Netlify dengan mengarahkan VITE_API_URL ke backend production.",
    konfigChange: "Lokal:\n- DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/absen_apel\"\n- VITE_API_URL=\"http://localhost:5000\"\n\nHosting:\n- DATABASE_URL=\"postgresql://postgres:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres\"\n- VITE_API_URL=\"https://absen-apel-backend.vercel.app\"",
    ringkasanPengujian: "Seluruh skenario pengujian fungsional utama (login, pembatasan lokasi, pengambilan koordinat & foto, CRUD mahasiswa/lokasi, pencatatan log anti-fake GPS) telah sukses dijalankan tanpa kendala kritis.",
    kendalaSolusiPengujian: "Kendala 1: Beberapa browser memblokir akses kamera & lokasi jika website tidak menggunakan protokol HTTPS.\nSolusi: Memastikan deployment backend dan frontend menggunakan HTTPS (SSL aktif).\n\nKendala 2: Akurasi GPS bawaan laptop/PC terkadang sangat rendah dibanding smartphone.\nSolusi: Memberikan notifikasi agar mahasiswa melakukan absen menggunakan perangkat smartphone dengan GPS akurasi tinggi.",
    kesimpulanPengujian: "Sistem dinyatakan LAYAK dan aman untuk digunakan dalam memantau absensi apel harian mahasiswa.",
    kesimpulan: "Aplikasi ABSEN-APEL berhasil dibangun dan diuji dengan baik. Penggunaan database relasional PostgreSQL yang dikombinasikan dengan validasi lokasi berbasis Haversine Formula serta parameter log tambahan terbukti efektif meminimalkan manipulasi kehadiran.",
    saran: "1. Menambahkan fitur rekap otomatis berkala (mingguan/bulanan) yang dikirim langsung ke email dosen wali kelas.\n2. Menggunakan machine learning / face recognition pada foto selfie untuk memastikan keaslian wajah mahasiswa.",
    referensi: "1. Prisma Client & Migrate Documentation (https://www.prisma.io/docs)\n2. Haversine Formula for Geolocation Calculations (https://en.wikipedia.org/wiki/Haversine_formula)\n3. MDN Web Docs for Geolocation API (https://developer.mozilla.org)",
    pernyataanAI: "Saya menyatakan bahwa dokumen RND dan proyek ini merupakan hasil karya sendiri yang dirancang untuk kebutuhan absensi apel di Politeknik Negeri Lampung. Penggunaan bantuan AI digunakan sebatas referensi penulisan kode dan telah dipahami serta divalidasi kebenarannya."
  };
  for(const k in v){const el=$(k);if(el&&!el.value)el.value=v[k];}
  updateProgress();
  alert("Data contoh aplikasi ABSEN-APEL berhasil dimasukkan pada field yang kosong.");
}

/* =========================================================
   PROGRESS
   ========================================================= */
function updateProgress(){
  const req=document.querySelectorAll("[data-required]");
  let filled=0;
  req.forEach(el=>{ if(el.value && el.value.trim()!=='') filled++; });
  const total=req.length||1;
  const pct=Math.round(filled/total*100);
  $("progressFill").style.width=pct+"%";
  $("progressPct").textContent=pct+"%";
}

/* =========================================================
   VALIDATE & PRINT
   ========================================================= */
function validateAndPrint(){
  const missing=[];
  document.querySelectorAll("[data-required]").forEach(el=>{
    if(!el.value || el.value.trim()===''){
      const lbl = el.getAttribute("data-label") || el.placeholder || el.id;
      missing.push(lbl);
    }
  });
  if(missing.length){
    const proceed=confirm("Ada "+missing.length+" bagian wajib yang belum diisi:\n\n- "+
      missing.slice(0,10).join("\n- ")+(missing.length>10?"\n- ...":"")+
      "\n\nTetap lanjut mencetak?");
    if(!proceed) return;
  }
  syncPrintMirrors();
  saveAllFormData(true);
  window.print();
}

/* =========================================================
   INIT
   ========================================================= */
window.addEventListener("DOMContentLoaded",()=>{
  buildTOC();
  const yr=$("copyYear"); if(yr) yr.textContent=new Date().getFullYear();
  loadAllFormData();

  $("btnTambahTabel").addEventListener("click",()=>{
    schemas.push({nama:`tabel_${schemas.length+1}`,kolom:[{nama:"id",tipe:"INT",isPK:true,isNotNull:true,refTable:"",refCol:""}]});
    renderDynamicTables();
  });
  $("btnTambahTestCase").addEventListener("click",()=>{
    testCases.push({id:nextTestCaseId++,skenario:"Skenario uji baru",hasilDiharapkan:"Deskripsikan hasil yang diharapkan",status:"Berhasil",buktiGambar:[]});
    renderTestCases();
  });
  $("simpanDataBtn").addEventListener("click",()=>saveAllFormData(false));
  $("resetBtn").addEventListener("click",resetDefault);
  $("contohBtn").addEventListener("click",isiContoh);
  $("cetakPDFBtn").addEventListener("click",validateAndPrint);
  $("exportBtn").addEventListener("click",exportJSON);
  $("importBtn").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",e=>{ if(e.target.files[0]) importJSON(e.target.files[0]); e.target.value=""; });

  document.querySelectorAll(".btn-tambah-gambar").forEach(btn=>{
    btn.addEventListener("click",()=>addImageToGallery(btn.getAttribute("data-gallery")));
  });

  // dukung Ctrl+P agar mirror tetap tersinkron
  window.addEventListener("beforeprint", syncPrintMirrors);

  // live progress + autosave (debounced)
  let t;
  document.addEventListener("input",()=>{
    updateProgress();
    clearTimeout(t); t=setTimeout(()=>saveAllFormData(true),1200);
  });
});
