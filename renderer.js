const { ipcRenderer } = require('electron');
let paketSayaci = 0;

window.addEventListener('DOMContentLoaded', () => {
    portlariYenile();

    const modeCheckbox = document.getElementById('mode-checkbox');
    if (modeCheckbox) {
        modeCheckbox.addEventListener('change', (e) => {
            const garajPaneli = document.getElementById('garaj-kontrol-paneli');
            const lblRace = document.getElementById('lbl-race');
            const lblGarage = document.getElementById('lbl-garage');

            if (e.target.checked) {
                document.body.classList.add('garage-active');
                if (garajPaneli) garajPaneli.style.display = 'flex';
                if (lblGarage) lblGarage.classList.add('active');
                if (lblRace) lblRace.classList.remove('active');
            } else {
                document.body.classList.remove('garage-active');
                if (garajPaneli) garajPaneli.style.display = 'none';
                if (lblRace) lblRace.classList.add('active');
                if (lblGarage) lblGarage.classList.remove('active');
            }
        });
    }

    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-yenile') {
            portlariYenile();
        }
    });

    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'btn-baglan') {
            const secilenPort = document.getElementById('port-listesi').value;
            if(!secilenPort) { alert("Lütfen önce bir port seçin!"); return; }
            ipcRenderer.send('port-baglan', secilenPort);
        }
    });

    document.body.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('btn-disconnect')) {
            ipcRenderer.send('port-kes');
        }
    });
});

function portlariYenile() {
    ipcRenderer.send('portlari-tarat');
}

ipcRenderer.on('port-listesi-sonuc', (event, portlar) => {
    const selectKutusu = document.getElementById('port-listesi');
    if (!selectKutusu) return;
    selectKutusu.innerHTML = '';

    if (portlar.length === 0) {
        selectKutusu.innerHTML = '<option value="">Cihaz Bulunamadı</option>';
        return;
    }

    portlar.forEach(port => {
        const option = document.createElement('option');
        option.value = port.path;
        option.innerText = port.path + (port.friendlyName ? ` (${port.friendlyName})` : '');
        selectKutusu.appendChild(option);
    });
});

ipcRenderer.on('baglanti-basarili', (event, hangiPort) => {
    const baglantiGrup = document.getElementById('baglanti-grup');
    if (baglantiGrup) {
        baglantiGrup.innerHTML = `
            <span style="color:#22c55e; font-weight:bold; margin-right: 15px;">${hangiPort}</span>
            <button class="btn btn-disconnect">BAĞLANTIYI KES</button>
        `;
    }
    const statusBadge = document.getElementById('sim-status');
    if (statusBadge) {
        statusBadge.innerText = "BAĞLANDI";
        statusBadge.className = "status-badge status-connected";
    }
});

ipcRenderer.on('baglanti-kesildi', () => {
    const baglantiGrup = document.getElementById('baglanti-grup');
    if (baglantiGrup) {
        baglantiGrup.innerHTML = `
            <select class="port-select" id="port-listesi"><option value="">Yenileniyor...</option></select>
            <button class="btn btn-refresh" id="btn-yenile">🔄 Yenile</button>
            <button class="btn btn-connect" id="btn-baglan">BAĞLAN</button>
        `;
    }
    portlariYenile();
    const statusBadge = document.getElementById('sim-status');
    if (statusBadge) {
        statusBadge.innerText = "BAĞLANTI KESİLDİ";
        statusBadge.className = "status-badge status-disconnected";
    }
});

ipcRenderer.on('baglanti-hatasi', (event, mesaj) => {
    alert("Bağlantı Hatası: " + mesaj);
});

// Gelen String verilerini ekrana yerleştirme alanı
ipcRenderer.on('gercek-veri', (event, data) => {
    paketSayaci++;
    const statPaket = document.getElementById('stat-paket');
    const statRaw = document.getElementById('stat-raw');
    if(statPaket) statPaket.innerText = paketSayaci;
    if(statRaw) statRaw.innerText = data.raw_string;

    // ⏱️ 1. ZAMAN: Saf milisaniye
    const sureDeger = document.getElementById('sure-deger');
    if(sureDeger) {
        sureDeger.innerText = data.zaman_ms + " ms";
        sureDeger.style.fontSize = "24px";
    }

    // 🚗 2. ARAÇ HIZI: Soldan sağa dolan animasyon
    const hizDeger = document.getElementById('hiz-deger');
    const hizIbre = document.getElementById('hiz-ibe'); // ID eşleşmesi sağlandı
    if(hizDeger) hizDeger.innerText = data.hiz_kmh;
    if(hizIbre) {
        let aci = -45 + (data.hiz_kmh * 2.7); 
        if(aci > 135) aci = 135; 
        hizIbre.style.transform = `rotate(${aci}deg)`;
    }

    // 🌡️ 3. BATARYA SICAKLIĞI
    const sicaklikDeger = document.getElementById('sicaklik-deger');
    const tempFill = document.getElementById('temp-fill');
    if(sicaklikDeger) sicaklikDeger.innerText = `${parseFloat(data.T_bat_C).toFixed(1)} °C`;
    if(tempFill) {
        let tempYuzde = (data.T_bat_C / 55) * 100;
        if(tempYuzde > 100) tempYuzde = 100;
        if(tempYuzde < 0) tempYuzde = 0;
        tempFill.style.height = tempYuzde + '%';
    }

    // ⚡ 4. BATARYA GERİLİMİ
    const voltajDeger = document.getElementById('voltaj-deger');
    if(voltajDeger) voltajDeger.innerText = `${parseFloat(data.V_bat_C).toFixed(2)} V`;

    // 🔋 5. KALAN ENERJİ
    const enerjiDeger = document.getElementById('enerji-deger');
    const pilBar = document.getElementById('enerji-fill');
    if(enerjiDeger) enerjiDeger.innerText = `${data.kalan_enerji_Wh} WH`;
    if(pilBar) {
        let pilYuzde = (data.kalan_enerji_Wh / 10000) * 100;
        if(pilYuzde > 100) pilYuzde = 100;
        pilBar.style.width = pilYuzde + '%';
        
        if(pilYuzde < 20) { pilBar.style.background = '#ef4444'; }
        else if(pilYuzde < 50) { pilBar.style.background = '#eab308'; }
        else { pilBar.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)'; }
    }
});