void setup() {
  Serial.begin(9600);
  // Canlı simülasyon için rastgele sayı üretecini başlatıyoruz
  randomSeed(analogRead(0));
}

void loop() {
  // 1. ZAMAN: Milisaniye cinsinden zaman (millis)
  unsigned long zaman_ms = millis();

  // 2. HIZ: 30-65 km/h arası dinamik hız
  byte hiz = random(30, 65);

  // 3. SICAKLIK: 35.0 - 42.5 °C arası küsuratlı değer
  float sicaklik = random(350, 425) / 10.0;

  // 4. VOLTAJ: 94.0 - 98.5 V arası küsuratlı değer
  float voltaj = random(940, 985) / 10.0;

  // 5. ENERJİ: 4000 - 4500 Wh arası kalan enerji
  unsigned int enerji = random(4000, 4500);

  // 🚀 STRING PROTOKOLÜ GÖNDERİMİ:
  // Verileri aralarına noktalı virgül koyarak düz metin olarak basıyoruz.
  // En sondaki Serial.println() ifadesi satır sonuna "\r\n" ekleyerek paketin bittiğini belirtir.
  Serial.print(zaman_ms);
  Serial.print(";");
  Serial.print(hiz);
  Serial.print(";");
  Serial.print(sicaklik, 1); // Virgülden sonra 1 basamak
  Serial.print(";");
  Serial.print(voltaj, 2);    // Virgülden sonra 2 basamak
  Serial.print(";");
  Serial.print(enerji);
  Serial.println(); // 🏁 Satır sonu (Paket bitti işareti)

  delay(500); // Yarım saniyede bir yeni paket gönder
}