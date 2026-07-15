const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { SerialPort } = require('serialport'); 
const { ReadlineParser } = require('@serialport/parser-readline'); // 🚀 Satır okuyucu kütüphane

let mainWindow;
let logDosyaYolu;
let aktifPort = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'HİLAL TELEMETRİ SİSTEMİ (STRING PROTOKOLÜ)',
        width: 1300,
        height: 850,
        backgroundColor: '#0a0b0d',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    mainWindow.loadFile('index.html');

    const tarihSifresi = new Date().toISOString().replace(/[:.]/g, '-');
    logDosyaYolu = path.join(__dirname, `telemetri_log_${tarihSifresi}.csv`);
    const baslikSatiri = "zaman_ms;hiz_kmh;T_bat_C;V_bat_C;kalan_enerji_Wh\n";
    fs.writeFileSync(logDosyaYolu, baslikSatiri, 'utf-8');
}

// 🔄 1. PORT TARAMA MOTORU
ipcMain.on('portlari-tarat', async (event) => {
    try {
        const portlar = await SerialPort.list();
        event.reply('port-listesi-sonuc', portlar);
    } catch (error) {
        console.error("Portlar taranırken hata oluştu:", error);
    }
});

// 🚀 2. STRING TABANLI DİNAMİK BAĞLANTI MOTORU
ipcMain.on('port-baglan', (event, secilenPortAdi) => {
    if (aktifPort && aktifPort.isOpen) {
        aktifPort.close();
    }

    try {
        aktifPort = new SerialPort({
            path: secilenPortAdi, 
            baudRate: 9600 
        });

        // 🧠 Satır sonu karakterine göre (Delimiter: \r\n) ayırıcıyı kuruyoruz
        const parser = aktifPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        aktifPort.on('open', () => {
            if (mainWindow) mainWindow.webContents.send('baglanti-basarili', secilenPortAdi);
        });

        aktifPort.on('error', (err) => {
            if (mainWindow) mainWindow.webContents.send('baglanti-hatasi', err.message);
        });

        // 📝 Satır satır temiz string geldikçe tetiklenen alan
        parser.on('data', (data) => {
            try {
                // Ham gelen veri örn: "21002;42;38.4;96.20;4500"
                const parcalar = data.split(';');

                // Toplam 5 verimizin (Zaman, Hız, Sıcaklık, Voltaj, Enerji) eksiksiz geldiğini doğruluyoruz
                if (parcalar.length === 5) {
                    const telemetryData = {
                        zaman_ms: parseInt(parcalar[0]),       // String'i tam sayıya çeviriyoruz
                        hiz_kmh: parseInt(parcalar[1]),        // String'i tam sayıya çeviriyoruz
                        T_bat_C: parseFloat(parcalar[2]).toFixed(1), // Küsuratlı sayıya çeviriyoruz (1 basamak)
                        V_bat_C: parseFloat(parcalar[3]).toFixed(2), // Küsuratlı sayıya çeviriyoruz (2 basamak)
                        kalan_enerji_Wh: parseInt(parcalar[4]),
                        raw_string: data // Üst barda göstermek için ham veriyi doğrudan yolluyoruz
                    };

                    // Arayüze gönder
                    if (mainWindow) {
                        mainWindow.webContents.send('gercek-veri', telemetryData);
                    }

                    // CSV dosyasına kaydet
                    const yeniSatir = `${telemetryData.zaman_ms};${telemetryData.hiz_kmh};${telemetryData.T_bat_C};${telemetryData.V_bat_C};${telemetryData.kalan_enerji_Wh}\n`;
                    fs.appendFile(logDosyaYolu, yeniSatir, (err) => {
                        if (err) console.error("CSV Yazma Hatası:", err);
                    });
                }
            } catch (error) {
                console.error("Veri ayrıştırma hatası:", error);
            }
        });

    } catch (error) {
        if (mainWindow) mainWindow.webContents.send('baglanti-hatasi', error.message);
    }
});

// 🛑 3. BAĞLANTIYI KESME MOTORU
ipcMain.on('port-kes', () => {
    if (aktifPort && aktifPort.isOpen) {
        aktifPort.close((err) => {
            if (!err && mainWindow) mainWindow.webContents.send('baglanti-kesildi');
        });
    }
});

app.whenReady().then(() => {
    app.baslangicZamani = Date.now();
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (aktifPort && aktifPort.isOpen) aktifPort.close();
    if (process.platform !== 'darwin') app.quit();
});