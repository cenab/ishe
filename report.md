**Pilot Proje iShe: Yaşlılar için Yapay Zeka Destekli İletişim ve
Bilişsel Fonksiyon İzleme Sistemi**

**Program Kodu:** 1002

**Proje No:** 324S300

Proje Yürütücüsü:

**Doç. Dr. ASLI KILAVUZ**

[Araştırmacı(lar):]{.underline}

Doç. Dr. ŞEBNEM BORA

Uzm. Dr. ÖZGÜR AKŞAN  
Uzm. Dr. FERYAL AKŞAN

Uzm. Dr. PINAR SIRMATEL BÜCÜK

[Danışman(lar):]{.underline}

[Bursiyer(ler):]{.underline}

Ekim 2025

İZMIR

# ÖNSÖZ

Bir çok farklı sebeple her geçen gün dünyada ve Türkiye'de yaşlı nüfus
oranının tüm nüfusa oranının artması yaşlılık döneminde refah ve yaşam
kalitesinin artırılması konusunda yeni stratejiler geliştirilmesini
gerektirmektedir. Yaşlı bireyler emeklilik, hareket kısıtlılıkları,
arkadaş ve aile üyelerinin kaybı gibi çeşitli nedenlerle sosyal
etkileşimlerini azaltmakta ve yalnızlık hissi yaşamaktadırlar. Sosyal
izolasyon; depresyon, anksiyete ve diğer mental sağlık sorunlarının yanı
sıra, fiziksel sağlık üzerinde de olumsuz etkiler yaratmaktadır. Yaşlı
bireyler arasında yalnızlığın depresyonla ilişkisi göz önüne
alındığında, sosyal izolasyonu azaltmaya yönelik programlar faydalı
olabilir.

Mide kanseri, dünya genelinde kansere bağlı ölümlerin başlıca
nedenlerinden biri olup, tedavi sürecinde önemli zorluklar içermektedir.
Neoadjuvan tedavi, cerrahi müdahale öncesi tümörün küçültülmesi amacıyla
kullanılan yaygın bir yöntem olmakla birlikte, tedaviye yanıtın
değerlendirilmesinde geleneksel histopatolojik yöntemler yetersiz
kalabilmektedir. Bu sebeple, daha hızlı, güvenilir ve tekrarlanabilir
sonuçlar elde edebilecek yeni teknolojilere olan ihtiyaç her geçen gün
artmaktadır. Bu bağlamda, \"Derin Öğrenmeyi Kullanarak Neoadjuvan
Tedaviye Yanıtın Histopatoloji Tabanlı Tahmini\" isimli projemiz, bu
ihtiyacı karşılamak amacıyla geliştirilmiştir.

Proje, TÜBİTAK'ın 1002-Hızlı Destek Programı kapsamında sunulmuş olup,
derin öğrenme tabanlı bir sistem geliştirilmesi hedeflemiştir. Bu
sistem, histopatolojik görüntülerden elde edilen verilerle neoadjuvan
tedaviye verilen yanıtları analiz ederek daha hızlı ve doğru klinik
kararların alınmasına olanak sağlamaktadır. YOLOv9 ve EfficientDet gibi
ileri düzey yapay zekâ algoritmalarının kullanılması, tedavi
yanıtlarının doğru bir şekilde tahmin edilmesini sağlamıştır. TÜBİTAK'ın
verdiği destek ile geliştirilen akıllı sistem, hastaların tedavi
süreçlerinin iyileştirilmesine doğrudan katkı sağlayacak ve bu alandaki
uygulamalara önemli bir yenilik katacaktır.

Bu çalışmayı mümkün kılan TÜBİTAK'a teşekkürlerimizi sunarız.

# İÇİNDEKİLER {#içindekiler}

[ÖNSÖZ [i](#önsöz)](#önsöz)

[İÇİNDEKİLER [ii](#içindekiler)](#içindekiler)

[ŞEKİLLER LİSTESİ [iii](#şekiller-listesi)](#şekiller-listesi)

[ÖZET [iv](#özet)](#özet)

[ABSTRACT [v](#abstract)](#abstract)

[1. GİRİŞ [1](#giriş)](#giriş)

[2. LİTERATÜR ÖZETİ [2](#literatür-özeti)](#literatür-özeti)

[3. GEREÇ VE YÖNTEM [7](#gereç-ve-yöntem)](#gereç-ve-yöntem)

[3.1 YOLOv9 Nedir? [7](#_Toc199118784)](#_Toc199118784)

[3.2 EfficientDet Nedir? [8](#_Toc199118785)](#_Toc199118785)

[3.3 YOLOv9 ve EfficientDet'in Kanser Tedavi Planlamasında Entegrasyonu
[9](#_Toc199118786)](#_Toc199118786)

[4. LABEL STUDIO İLE ETİKETLEME VE TÜMÖR TESPİT VERİSETİNİN
OLUŞTURULMASI [9](#_Toc199118787)](#_Toc199118787)

[4.1 Dokuz Eylül Hastanesi\'nden Alınan Görüntülerin Tümör Tespiti İçin
Kullanımı [9](#_Toc199118788)](#_Toc199118788)

[4.2 Etiketlenmiş Veri ile YZ Modellerinin Eğitilmesi
[11](#_Toc199118789)](#_Toc199118789)

[4.3 Veri Artırma (Data Augmentation)
[11](#_Toc199118790)](#_Toc199118790)

[4.3.1 Kullanılan Dönüşüm Türleri [11](#_Toc199118791)](#_Toc199118791)

[4.3.1.1 Geometrik Dönüşümler [11](#_Toc199118792)](#_Toc199118792)

[4.3.1.2 Renk Alanı Dönüşümleri [12](#_Toc199118793)](#_Toc199118793)

[4.1.3.3 Gürültü ve Bozulma (Noise & Blur)
[12](#_Toc199118794)](#_Toc199118794)

[5. Model Kurulumu ve Değerlendirme Metodolojisi
[13](#_Toc199118795)](#_Toc199118795)

[5.1 Model Seçimi ve Transfer Öğrenme
[13](#_Toc199118796)](#_Toc199118796)

[5.2 Eğitim Süreci [13](#_Toc199118797)](#_Toc199118797)

[5.2.1 YOLOv9 Yapılandırması [13](#_Toc199118798)](#_Toc199118798)

[5.2.2 EfficientDet Yapılandırması [14](#_Toc199118799)](#_Toc199118799)

[5.3 Kullanılan Metrikler [14](#_Toc199118800)](#_Toc199118800)

[5.3.1 Değerlendirme Metodları ve Metriği
[14](#_Toc199118801)](#_Toc199118801)

[6. Bulgular [14](#bulgular)](#bulgular)

[6.1 KARMAŞIKLIK MATRİSİ [15](#_Toc199118803)](#_Toc199118803)

[6.2 ROC CURVE (Receiver Operating Characteristic Curve)
[16](#_Toc199118804)](#_Toc199118804)

[6.3 PR CURVE (Precision-Recall Curve)
[18](#_Toc199118805)](#_Toc199118805)

[6.4 Çıkarım [20](#_Toc199118806)](#_Toc199118806)

[6.4.1 YOLOv9 Performans Özeti [21](#_Toc199118807)](#_Toc199118807)

[6.4.1.1 Tümör F1-Skoru [21](#_Toc199118808)](#_Toc199118808)

[6.4.1.2 Fibrozis F1-Skoru [21](#_Toc199118809)](#_Toc199118809)

[6.4.1.3 IoU (Mask Overlap) [21](#_Toc199118810)](#_Toc199118810)

[6.4.2 EfficientDet Performans Özeti
[22](#_Toc199118811)](#_Toc199118811)

[6.4.2.1 EfficientDet Performans Özeti
[22](#_Toc199118812)](#_Toc199118812)

[6.4.2.2 Fibrozis F1-Skoru [22](#_Toc199118813)](#_Toc199118813)

[6.4.2.3 Box Precision (BoxP) / Box Recall (BoxR)
[22](#_Toc199118814)](#_Toc199118814)

[6.4.3 Sonuç Yorumları [22](#_Toc199118815)](#_Toc199118815)

[7. Tartışma [23](#tartışma)](#tartışma)

[7.1 Model Performanslarının Karşılaştırılması
[23](#_Toc199118817)](#_Toc199118817)

[7.2 Sınıf Performansları: Tümör ve Fibrozis Ayrımı
[24](#_Toc199118818)](#_Toc199118818)

[7.3 Literatürle Karşılaştırma [24](#_Toc199118819)](#_Toc199118819)

[7.4 Gerçek Klinik Uygulamalara Entegrasyon Potansiyeli
[24](#_Toc199118820)](#_Toc199118820)

[7.5 Karşılaşılan Zorluklar [24](#_Toc199118821)](#_Toc199118821)

[7.6 Gelecekteki Çalışma Önerileri [25](#_Toc199118822)](#_Toc199118822)

[8. Sonuç [25](#sonuç)](#sonuç)

[9. KAYNAKÇA [27](#kaynakça)](#kaynakça)

# ŞEKİLLER LİSTESİ {#şekiller-listesi}

[Şekil 1: Transfer öğrenme modellerinin karşılaştırması
[9](#_Toc199118767)](#_Toc199118767)

[Şekil 2: Skor 2'deki bir olguya ait görsel
[10](#_Toc199118768)](#_Toc199118768)

[Şekil 3: Veri Artırma [12](#_Toc199118769)](#_Toc199118769)

[Şekil 4: Karmaşıklık Matrisi [15](#_Toc199118770)](#_Toc199118770)

[Şekil 5: Alıcı İşletim Karakteristiği Eğrisi (Receiver Operating
Characteristic Curve) [17](#_Toc199118771)](#_Toc199118771)

[Şekil 6: Precision (Kesinlik) ile Recall (Duyarlılık) Eğrisi
[19](#_Toc199118772)](#_Toc199118772)

# ÖZET

Mide kanseri, dünya genelinde en ölümcül hastalıklardan biri olup,
kanserle ilişkili ölümler arasında üçüncü sırada yer almaktadır.
Neoadjuvan tedavi, ameliyat öncesinde tümörleri küçültmek için uygulanan
bir yöntemdir. Ancak, bu tedaviye verilen yanıtın doğru bir şekilde
değerlendirilmesi, geleneksel histopatolojik incelemelerde zaman alıcı
olması ve gözlemciler arası farklılık göstermesi nedeniyle zorluklar
barındırmaktadır. Bu çalışmada, yapay zeka ve derin öğrenme tabanlı
modellerin bu süreci daha hızlı, doğru ve standart hale getirme
potansiyeli araştırılmıştır.

Bu kapsamda, YOLOv9 ve EfficientDet modelleri kullanılarak
histopatolojik görüntüler analiz edilmiştir. YOLOv9, gerçek zamanlı
tümör tespiti sağlarken, EfficientDet çok ölçekli özellik çıkarımı ve
sınıflandırma işlemlerinde kullanılmıştır. Çalışmada, veri toplama,
görüntü işleme, transfer öğrenme ve model optimizasyonu aşamaları
uygulanarak modellerin performansı F1-skora (Fang vd. (2022), doğruluk
ve geri çağırma metriklerine göre değerlendirilmiştir.

Ön bulgular, yapay zeka destekli analizlerin, neoadjuvan tedavi
yanıtlarını tahmin etmede geleneksel yöntemlerden daha başarılı olduğunu
göstermektedir. Yapay zeka tabanlı modellerin patolojik incelemelere
entegre edilmesi, erken teşhis süreçlerini hızlandırarak
kişiselleştirilmiş tedavi yöntemlerinin geliştirilmesine katkı
sağlamaktadır.

***Anahtar Kelimeler*** --Yapay Zekâ, Derin Öğrenme, Tümör Tespiti,
YOLOv9, EfficientDet, Neoadjuvan Tedavi, Patoloji Analizi.

# ABSTRACT

Stomach cancer is one of the most deadly diseases worldwide and ranks
third among cancer-related deaths. Neoadjuvant therapy is a method used
to shrink tumors before surgery. However, evaluating the response to
this treatment accurately can be challenging due to the time-consuming
nature of traditional histopathological examinations and inter-observer
variability. This study explores the potential of artificial
intelligence and deep learning-based models to make this process faster,
more accurate, and standardized.

In this context, histopathological images were analyzed using YOLOv9 and
EfficientDet models. YOLOv9 was used for real-time tumor detection,
while EfficientDet was applied for multi-scale feature extraction and
classification. The study assessed the performance of the models using
F1-score, accuracy, and recall metrics by applying stages such as data
collection, image processing, transfer learning, and model optimization.

Preliminary findings show that AI-supported analyses are more successful
than traditional methods in predicting responses to neoadjuvant therapy.
The integration of AI-based models into pathological examinations
accelerates early diagnosis processes and contributes to the development
of personalized treatment methods.

***Keywords*** --Deep Learning, Histopathological Analysis, Tumor
Detection, YOLOv9.

# 1. GİRİŞ {#giriş}

Ekonomik ve sosyokültürel koşulların gelişmesi, doğum oranlarının
azalması, modern tıbbın ilerlemesi gibi faktörlere bağlı olarak son
yıllarda dünya nüfusu yaşlanmakta ve doğuşta beklenen yaşam süresi
artmaktadır (WHO, 2022). Ülkemizde de Türkiye İstatistik Kurumu
tarafından yaşlı nüfusun toplam nüfus içindeki oranı 2024 yılında %10,6
iken, 2030 yılında %13,5 ve 2080 yılında %33,4 olacağı öngörülmüştür
(TURKSTAT, 2025). Stewart'a göre yaşlı nüfusun artması, yaşlılık
döneminde refah ve yaşam kalitesinin artırılması konusunda yeni
stratejiler geliştirilmesini gerektirmektedir (Stewart, 2014). Yaşlı
bireyler emeklilik, hareket kısıtlılıkları, arkadaş ve aile üyelerinin
kaybı gibi çeşitli nedenlerle sosyal etkileşimlerini azaltmakta ve
yalnızlık hissi yaşamaktadırlar. Sosyal izolasyon; depresyon, anksiyete
ve diğer mental sağlık sorunlarının yanı sıra, fiziksel sağlık üzerinde
de olumsuz etkiler yaratmaktadır (Coyle & Dugan, 2012; Holt-Lunstad et
al., 2015). Yaşlı bireyler arasında yalnızlığın depresyonla ilişkisi göz
önüne alındığında, sosyal izolasyonu azaltmaya yönelik programlar
faydalı olabilir.

Sağlıklı yaşlanma sürecinde bilişsel işlevlerde belirgin bir gerileme
görülmemekle birlikte, kronik hastalıklar ve bilişsel bozuklukların
görülme sıklığı artış göstermektedir (Corrada et al., 2010; Morley,
2018). Bilişsel bozukluklar klinik olarak yavaş seyrettiğinden ve normal
yaşlanma süreci ile ayrımının yapılmasında güçlükler olduğundan gözden
kaçabilmektedir (KUŞOĞLU et al., 2021; Petersen et al., 1999). Yalnız
yaşayan yaşlı bireylere yüz yüze görüşmelere alternatif olabilecek
yöntemlerin geliştirilmesi ve bunların etkinliklerinin incelenmesi önem
taşımaktadır. Nöropsikolojik değerlendirmenin bilgisayar-tablet
aracılığıyla ya da mobil teknolojilerle dijital olarak uygulanması,
testlerin daha geniş kesimlere uygulanabilirliğini ve standardizasyonunu
sağlamaktadır (Germine et al., 2019). Ayrıca, nöropsikolojik
değerlendirme, dijital uygulama ile yapıldığında uygulayıcının
önyargılarından arındırılmaktadır (Zygouris & Tsolaki, 2015). Bu
yöntemlerle demans tanısı koymanın mümkün olmadığı ve bu yöntemlerin
sadece bilişsel bozukluk gösteren bireylerin saptanması ve gerekli
yönlendirmelerin yapılması için kullanılabilir özellikte olduğu
belirtilmektedir. Yaşlı bireylerin teknoloji kullanımında yaşadığı
zorluklar, onların dijital çözümlerden tam anlamıyla faydalanamamasına
yol açmaktadır. Bu nedenle, yaşlı bireylerin ihtiyaçlarına uygun,
kullanıcı dostu ve erişilebilir teknoloji geliştirilmesi gerekmektedir.

Proje iShe, mobil telefona entegre edilen bir yapay zeka uygulaması
sayesinde yalnız yaşayan yaşlı bireylerin sosyal etkileşimlerini
artırarak yalnızlık hissini ve depresif semptomları azaltmayı, bilişsel
sağlık durumunu izleyerek, Alzheimer ve demans gibi nörolojik
hastalıkların erken belirtilerini tespit etmeyi ve zamanında müdahale
etmeyi amaçlamıştır. Bu proje, ileri düzeyde doğal dil işleme (NLP:
Natural Language Processing) yeteneklerine sahip bir Büyük Dil Modeli
(LLM, Large Language Model) kullanarak, yaşlı bireylerin bilişsel sağlık
durumlarını izlemek ve sosyal etkileşimlerini artırmak amacıyla prototip
bir mobil uygulama geliştirmeyi hedeflemiştir. Bu sayede, yaşlı
bireylerin basit ve anlaşılır, ekonomik bir yapay zeka uygulamasını
etkin bir şekilde kullanmaları, yaşam kalitesi ve psikolojik
refahlarının artması beklenmektedir.

# 2. LİTERATÜR ÖZETİ {#literatür-özeti}

Dünyada ve ülkemizde gün geçtikçe yaşlı nüfus oranı artmaktadır. Yaşlı
bireylerin çeşitli nedenlerle sosyal etkileşimleri azalmakta ve
yalnızlık hissi yaşamaktadırlar. Bu durum mental sağlık yanı sıra
fiziksel sağlık üzerinde de olumsuz sonuçlara yol açmakta ve bu da yaşlı
bireylerin yaşam kalitelerini olumsuz olarak etkilemektedir (Coyle &
Dugan, 2012; Haslam et al., 2014; Holt-Lunstad et al., 2015). Yaşlı
bireyler arasında yalnızlığın depresyonla ilişkisi göz önüne
alındığında, sosyal izolasyonu azaltmaya yönelik programlar faydalı
olabilir. İtalya\'da çoğu kırılgan olan çok sayıda izole yaşlı bireye
hizmet veren bir telefon desteği ve acil müdahale programı, 10 yıllık
bir süre zarfında intihar oranlarının beklenenden daha düşük olduğunu
tespit etmiştir, bu da depresif semptomlarda bir azalma meydana gelmiş
olabileceğini düşündürmektedir (De Leo et al., 2002). Bu sorunları ele
almak ve yaşlı bireylerin daha sağlıklı ve mutlu bir yaşam sürmelerini
sağlamak amacıyla, yenilikçi teknolojik çözümlere ihtiyaç duyulmaktadır.
Proje iShe, mobil telefona entegre edilen bir yapay zeka uygulaması
sayesinde yalnız yaşayan yaşlı bireylerin sosyal etkileşimlerini
artırarak yalnızlık hissini ve depresif semptomları azaltmayı
hedeflemektedir.

Sağlıklı yaşlanma sürecinde bilişsel işlevlerde belirgin bir gerileme
görülmemekle birlikte, kronik hastalıklar ve bilişsel bozuklukların
görülme sıklığı artış göstermektedir (Corrada et al., 2010; Karan &
Tufan, 2010; Morley, 2018). Geldmacher ve arkadaşları, demansın
ilerleyişini bir yıl geriye çekmenin bile, demanslı kişilerin yaşam
kalitesini artırdığını ve ilişkili sosyoekonomik yükü ciddi anlamda
azalttığını belirtmektedirler (Geldmacher et al., 2014). 70 yaş ve üzeri
kişilerin %20'sinden fazlasını etkileyen normal yaşlanma süreci ile
demans arasındaki evre olan hafif bilişsel bozukluk (HBB), demans için
bir risk faktörüdür (Bruscoli & Lovestone, 2004). Bilişsel bozukluklar
klinik olarak yavaş seyrettiğinden ve normal yaşlanma süreci ile
ayrımının yapılmasında güçlükler olduğundan gözden kaçabilmektedir
(KUŞOĞLU et al., 2021). Nöropsikolojik testler; bilişsel bozuklukların
tanısı açısından önemli bir yöntem olsa da uygulamanın yüz yüze
yapılmasından dolayı birçok kısıtlılık da taşımaktadır (Miller & Barr,
2017). Yaşlı bireyler yaşlanma ile bağlantılı yaşadıkları fiziksel
zorluklar ya da kendileriyle ilgilenebilecek yakınları olmadığı zaman
hastaneye ulaşım açısından sorun yaşamaktadır. Diğer yandan,
nöropsikolojik testleri uygulayan uzmanların sıklıkla büyükşehirlerde ve
merkezi hastanelerde olması, buraların dışında oturan bireylere
nöropsikolojik değerlendirme yapılmasını zorlaştırmaktadır. Bu bağlamda,
yüz yüze görüşmelere alternatif olabilecek yöntemlerin geliştirilmesi ve
bunların etkinliklerinin incelenmesi önem taşımaktadır. Nöropsikolojik
değerlendirmenin bilgisayar-tablet aracılığıyla ya da mobil
teknolojilerle dijital olarak uygulanması, testlerin daha geniş
kesimlere uygulanabilirliğini ve standardizasyonunu sağlamaktadır
(Germine et al., 2019). Ayrıca, nöropsikolojik değerlendirme, dijital
uygulama ile yapıldığında uygulayıcının önyargılarından
arındırılmaktadır (Zygouris & Tsolaki, 2015). Mevcut bilgisayarlı ve
mobil temelli batarya ve testleri içeren derleme çalışmalarının dikkat
çektiği önemli bir ortak nokta, bu batarya ve uygulamaların yüz yüze
nöropsikolojik değerlendirmenin yerini alma amaçlı olmadığıdır (Aslam et
al., 2018; García-Casal et al., 2017; Zygouris & Tsolaki, 2015). Bu
yöntemlerle demans tanısı koymanın mümkün olmadığı ve bu yöntemlerin
sadece bilişsel bozukluk gösteren bireylerin saptanması ve gerekli
yönlendirmelerin yapılması için kullanılabilir özellikte olduğu
belirtilmektedir. Bilgisayarlı nöropsikolojik batarya ve mobil
uygulamaları içeren yöntemlerin hepsi yurtdışında geliştirilmiştir ve
CNS Vital (The Central Nervous System Vital Signs) ve CDR haricindeki
yöntemlerin Türkçe seçeneği bulunmamaktadır. Bu yöntemlere ek olarak,
Zorluoglu ve arkadaşları, demans hastalarındaki bilişsel işlevleri
tarama amaçlı bir mobil uygulama geliştirmişlerdir (Zorluoglu et al.,
2015). Dikkat, bellek, yürütücü işlevler, dil, aritmetik ve görsel
mekansal işlevleri değerlendiren testleri içeren bu uygulamayı, bireyler
kendi başlarına yapmaktadırlar. Yüksek olmayan bir uyum geçerliği olan
bu uygulamanın klinik kullanımı bulunmamaktadır. Yapay zeka ve dijital
sağlık izleme sistemlerinin, sağlık hizmetlerinin kalitesini ve
erişimini artırdığı gösterilmiştir (Topol, 2019). Yaygın HBB tarama
testleri zaman alıcıdır, bu nedenle gelişigüzel kitlesel tarama maliyet
etkin olmayacaktır. Bu yüzden sadece soru tabanlı, çizim ve yazma
görevlerini içermeyen bir HBB testi aracılığıyla daha ileri tarama için
adayları hızla seçmek üzere dijital teknolojiyi kullanan bir proje
planlanmıştır. Proje iShe, bilişsel sağlık durumunu izleyerek, Alzheimer
ve demans gibi nörolojik hastalıkların erken belirtilerini tespit etmeyi
ve zamanında müdahale etmeyi amaçlamıştır.

Smith ve arkadaşlarının yaptığı çalışma, sanal gerçeklik, robotlar,
telemedisin, yazılımlar, video oyunları ve akıllı telefon
uygulamalarının yaşlı bireylerin bilişsel ve psikolojik sonuçları
üzerinde olumlu etkiler yaratabileceğini ve sağlık sistemlerinde maliyet
tasarrufu sağlayabileceğini göstermektedir (Smith et al., 2009). Yaşlı
bireylerin teknoloji kullanımında yaşadığı zorluklar, onların dijital
çözümlerden tam anlamıyla faydalanamamasına yol açmaktadır. Bu nedenle,
yaşlı bireylerin ihtiyaçlarına uygun, kullanıcı dostu ve erişilebilir
teknoloji geliştirilmesi gerekmektedir. Kullanıcı dostu arayüzlerin,
yaşlı bireylerin teknoloji kullanımını artırdığı ve bu teknolojilerden
daha fazla fayda sağlamalarına yardımcı olduğu bulunmuştur (Czaja et
al., 2006; Fisk et al., 2009). Proje iShe, basit ve anlaşılır, ekonomik
bir yapay zeka uygulaması kullanarak, yaşlı bireylerin teknolojiyi etkin
bir şekilde kullanabilmelerini sağlamayı ve bu sayede yaşam kalitesini
ve psikolojik refahını artırmayı hedeflemiştir.

Sağlık verilerinin ve kişisel verilerin güvenliği ve gizliliği,
kullanıcıların güvenini kazanmak ve yasal düzenlemelere uyum sağlamak
için kritik öneme sahiptir. Sağlık verilerinin güvenliğinin sağlanması,
kullanıcıların dijital sağlık çözümlerine olan güvenini artırmakta ve bu
çözümlerin benimsenmesini sağlamaktadır (Gajanayake Randike et al.,
2014; Rumbold & Pierscionek, 2017). **Proje iShe**, veri güvenliği ve
kullanıcı gizliliği konusunda en yüksek standartları uygulayarak,
görüntü kaydı kullanmaksızın, kullanıcıların güvenliğini sağlamayı
amaçlamıştır. 

Bu proje, ileri düzeyde doğal dil işleme (NLP: Natural Language
Processing) yeteneklerine sahip bir Büyük Dil Modeli (LLM, Large
Language Model) kullanarak, yaşlı bireylerin bilişsel sağlık durumlarını
izlemek ve sosyal etkileşimlerini artırmak amacıyla prototip bir mobil
uygulama geliştirmeyi hedeflemiştir.

# 3. GEREÇ VE YÖNTEM {#gereç-ve-yöntem}

Proje iShe; mobil telefonlara yüklenerek kullanılacak olan bir yapay
zeka uygulamasıdır. Bilişsel becerileri değerlendirmek için
katılımcılara sohbet sırasında her gün gün içerisinde 20 dakika kullanım
sırasında Kısa taşınabilir zihinsel durum anketindeki 10 soru
sorulmuştur. Araştırmanın evrenini Ege Üniversitesi Tıp Fakültesi İç
Hastalıkları AD. Geriatri polikliniğine başvuran yaşlı bireyler
oluşturmuştur. Örneklemi araştırma başladıktan sonra polikliniğe
başvuran bireyler arasından seçilen araştırmanın dahil olma kriterlerini
karşılayan ilk 10 bireyden oluşmuştur. Katılımcıların çalışmadan ayrılma
riskine karşılık ayrıca yedek 10 katılımcı daha belirlenmiştir.
Araştırmaya dâhil olma kriterleri; 65 yaş ve üzeri olma, çalışmaya
katılmaya gönüllü olma ve yalnız yaşamaktır. Araştırmadan dışlama
kriterleri ise psikiyatrik hastalık varlığı, kognitif bozukluk tanısı
olması, işitsel ve/veya konuşma problemlerinin olmasıdır.

**3.1. Veri Toplama Araçları**

Araştırma verileri, Tanıtıcı Bilgi Formu, Yaşlılar İçin Yalnızlık Ölçeği
(YİYÖ), Geriatrik Depresyon Ölçeği-15 (GDÖ-15), Büyük Dil Modeli (LLM),
Kısa taşınabilir zihinsel durum anketi (Short Portable Mental Status
Questionnaire - SPMSQ) ve Standardize Mini Mental Test (SMMT)
kullanılarak toplanacaktır.

**3.1.1. Tanıtıcı Bilgi Formu:** Yaş, cinsiyet, eğitim düzeyi (okuryazar
değil, okuryazar, ilkokul mezunu, ortaokul mezunu, lise mezunu,
üniversite mezunu, yüksek lisans mezunu, doktora mezunu), gelir durumu
(geliri giderinden düşük, geliri giderine eşit, geliri giderinden
fazla), kronik hastalık varlığı (diabetes mellitus, hipertansiyon,
kardiyovasküler sistem hastalığı, kronik obstrüktif akciğer hastalığı,
astım, kronik böbrek hastalığı, kanser ve diğerleri) olmak üzere toplam
6 sorudan oluşmaktadır.

**3.1.2. Yaşlılar İçin Yalnızlık Ölçeği:** Yalnızlık duygusunu ölçmek
amacıyla Gierveld ve Kamphuis tarafından geliştirilmiş (de Jong-Gierveld
& Kamphuls, 1985), daha sonra Tilburg ve Gierveld tarafından revize
edilmiş olan (de Jong Gierveld & van Tilburg, 1999) ölçek bilişsel
davranışçı yaklaşımı esas alarak geliştirilmiş bir ölçme aracıdır.
Toplamda 11 maddesi olan ölçek, iki alt boyuttan oluşmaktadır: ölçeğin
altı maddesi (2, 3, 5, 6, 9, 10) duygusal yalnızlığı ölçen, olumsuz
maddeler; beş maddesi ise (1, 4, 7, 8, 11) sosyal yalnızlığı ölçen,
olumlu maddelerdir. Toplam yalnızlığı hesaplamak için; duygusal
yalnızlık sonuçları ile sosyal yalnızlık sonuçları toplanmalıdır. Bu iki
boyutun toplamı genel yalnızlık puanını oluşturmaktadır. Ölçekte yer
alan her bir ifadenin içerdiği durumun kişi tarafından ne derecede
yaşanıldığı, 3'lü likert tipi dereceleme ile belirlenmektedir. Üçlü
dereceleme şu şekildedir; 0=evet, 1=olabilir, 2=hayır. Kişiyi en iyi
ifade ettiği düşünülen şıkkın işaretlenmesi yoluyla ölçek yanıtlanır.
Ölçek maddelerinin 6'sı düz, 5'i ters yönde kodlanmıştır. Olumlu yöndeki
ifadeleri içeren maddeler (1, 4, 7, 8, 11) 0=evet, 1=olabilir, 2=hayır;
olumsuz yöndeki ifadeleri içeren maddeler (2, 3, 5, 6, 9, 10) bunun
tersi olarak 2=evet, 1=olabilir, 0=hayır şeklinde puanlanmaktadır.
Ölçekten alınacak en düşük puan 0, en yüksek puan 22'dir. Toplam
yalnızlık dört seviyeye ayrılabilir: 1. Seviye; yalnız değil / yalnızlık
hissetmiyor (puan 0-4); 2. Seviye; kabul edilebilir yalnızlık (puan
5-14); 3. Seviye; çok yalnız (puan15-18); 4. Seviye; Çok yoğun yalnızlık
(puan 19-22). Ölçeğin geçerlik ve güvenirlik çalışması Akgül ve
Yeşilyaprak tarafından yapılmıştır (Akgül & Yeşilyaprak, 2015). Ölçek
kullanım izni alınmıştır. Ölçek çalışma başlangıcında ve sonunda
kullanılmıştır.

**3.1.3. Geriatrik Depresyon Ölçeği-15 (Kısa Form):** Sheikh ve
arkadaşları tarafından geliştirilmiş olan ölçekte, yaşlılara yönelik, öz
bildirime dayalı, yanıtlaması kolay, geçen hafta süresince
hissettiklerini belirten, yanıtları sadece \"evet\" ya da \"hayır\"
şeklinde olan 15 soru sorulmuştur (Yesavage & Sheikh, 1986). Depresyon
lehine her yanıt bir puan, diğer yanıtlar sıfır puan değerindedir. Tam
puan 0-15 arasındadır. 0-5 puan normal, depresif belirti yok, ≥6 puan
depresif belirti var şeklinde değerlendirilmiştir. Ölçeğin Türkçe
geçerlik ve güvenirliği Durmaz ve arkadaşları tarafından yapılmıştır
(Durmaz, 2017). Ölçek kullanım izni alınmıştır. Ölçek çalışma
başlangıcında ve sonunda kullanılmıştır.

**3.1.4. Standardize Mini Mental Test:** Kısa bir eğitim almış hekim,
hemşire ve psikologlarca 10 dakika gibi bir süre içinde uygulanabilir
bir testtir. Uygulama esnasında hasta ve hekim açısından rahatsız edici,
utandırıcı veya güçlük verici bir yanı bulunmamaktadır. Yönelim, kayıt
hafızası, dikkat ve hesaplama, hatırlama ve lisan olmak üzere beş ana
başlık altında toplanmış on bir maddeden oluşmakta ve toplam puan olan
30 üzerinden değerlendirilmektedir (Folstein et al., 1975). Türkçe
geçerlik güvenirlik çalışması Güngen ve arkadaşları tarafından
yapılmıştır. 23/24 eşik değeri SMMT'in Türk yaşlılarında hafif demansın
tanısında oldukça yüksek duyarlık ve özgüllüğe sahip olduğu
belirlenmiştir (Güngen et al., 2002). Ölçek kullanım izni alınmıştır.
Ölçek çalışma başlangıcında ve sonunda kullanılmıştır.

**3.1.5. Kısa taşınabilir zihinsel durum anketi (Short Portable Mental
Status Questionnaire - SPMSQ)**: Yaşlılarda bilişsel işlevselliği ölçer.
Ölçek 10 sorudan oluşur. Puanlaması yanlış tepki sayısı olarak yapılır
(alınabilecek en yüksek puan: 10). Puanların 0-2 arasında olması
"normal", 3-4 arasında olması "hafif şiddette bilişsel bozukluk", 5-7
arasında olması "orta şiddette bilişsel bozukluk\", 8-10 puan olması
"şiddetli bilişsel bozukluk\" olarak değerlendirilir (Pfeiffer, 1975).
Ölçeğin Türkçe geçerlik ve güvenirliği Dikmeer tarafından yapılmıştır
(Dikmeer et al., 2025). Ölçek kullanım izni alınmıştır.Ölçeğin Türkçe
geçerlilik ve güvenirlik çalışması henüz yayınlanmamıştır. Ölçek
kullanım izni alınmıştır. Kısa taşınabilir zihinsel durum anketindeki
sorular yapay zeka uygulaması içerisine yerleştirilecek ve her gün belli
aralarla katılımcılara sohbet sırasında sorulmuştur.

**3.2. Büyük Dil Modeli:** Araştırmamızda kullanılacak olan geniş bir
metin veri seti üzerinde eğitilmiş, güçlü doğal dil işleme yeteneklerine
sahip bir modeldir. LLM\'ler, milyonlarca, hatta milyarlarca kelimeyle
beslenerek eğitilmiş olup, dilin anlamını, bağlamını ve gramer yapısını
derinlemesine öğrenir (Singhal et al., 2023; Thirunavukarasu et al.,
2023). Bu tür modeller, metin üretimi, metin tamamlama, soru yanıtlama,
özetleme gibi çeşitli dil işleme görevlerinde yüksek performans
sergiler. LLM, belirli bir görev veya veri setine yönelik olarak
özelleştirilebilir ve bu süreç, fine-tuning adı verilen bir teknikle
gerçekleştirilir. Fine-tuning, modelin belirli bir alandaki veri
üzerinde yeniden eğitilerek, spesifik görevlerde daha hassas ve doğru
sonuçlar vermesini sağlar. Bu projede kullanılacak LLM, yaşlı bireylerle
yapılan sohbetlerde, belirli bilişsel değerlendirme sorularını sormak ve
bu sorulara verilen yanıtları analiz etmek üzere optimize edilmiştir.
Model, kullanıcıların bilişsel durumlarını değerlendirmek ve
gerektiğinde onları uygun sağlık hizmetlerine yönlendirmek için
tasarlanmıştır.

LLM\'nin yetenekleri arasında:

• Bağlamsal Anlayış: Model, cümlelerin ve kelimelerin bağlamını
anlayarak, anlamlı ve tutarlı yanıtlar üretebilir.

• Dil Üretimi: Kullanıcıların sorularını yanıtlayabilir, metin tamamlama
ve önerilerde bulunabilir.

• Öğrenme ve Adaptasyon: Fine-tuning yoluyla belirli bir görev veya
alana yönelik özelleştirilebilir, böylece daha spesifik ihtiyaçlara
yanıt verebilir (Sartori & Orrù, 2023).

Bu dil modeli, yaşlı bireylerin sosyal etkileşimlerini artırarak,
yalnızlık hissini azaltmayı ve bilişsel sağlık durumlarını izlemeyi
amaçlayan yenilikçi bir çözüm sunmaktadır.

Projenin ilk aşamasında, bir mobil telefon aracılığıyla ChatGPT
kullanılarak temel bir iletişim ve sağlık izleme sistemi prototipi
geliştirilmiştir. ChatGPT\'nin belirli sınırları ve fonksiyonları, yaşlı
kullanıcıların ihtiyaçlarına göre optimize edilmiştir. İlerleyen
aşamalarda, açık kaynak kodlu diğer yapay zeka teknolojileri
kullanılarak, ulusal ölçekte geliştirilecek ve özelleştirilecek
yazılımlar entegre edilmiştir. Bu süreçte, ulusal yazılım geliştirme
yetenekleri güçlendirilerek bağımsız ve sürdürülebilir bir yapay zeka
sistemi oluşturulmuştur. GPT-4 gibi LLM üzerine inşa edilen ChatGPT,
insan benzeri metinler oluşturma, soruları yanıtlama, metin tamamlama ve
çeşitli doğal dil işleme görevlerini yerine getirme yeteneklerine
sahiptir. ChatGPT, çok geniş bir metin veri seti üzerinde önceden
eğitilmiştir ve bu sayede dilin gramer yapısını, kelime dağarcığını ve
bağlamsal ilişkilerini derinlemesine öğrenmiştir. Bu model, konuşma
diline uygun yanıtlar üretebilme yeteneğiyle bilinir ve genellikle
sohbet uygulamaları, müşteri hizmetleri botları, eğitim platformları ve
diğer metin tabanlı etkileşimler için kullanılır.

Bu projede ChatGPT, yaşlı bireylerle yapılan sohbetlerde belirli
bilişsel değerlendirme sorularını sormak ve bu sorulara verilen
yanıtları analiz etmek amacıyla günde iki kez kullanılmıştır. Model,
kullanıcının bilişsel durumunu değerlendirmek ve gerektiğinde uygun
sağlık hizmetlerine yönlendirmek için optimize edilmiştir. ChatGPT\'nin
yetenekleri, proje kapsamındaki kullanıcılarla etkileşimleri
kişiselleştirir ve onların ihtiyaçlarına duyarlı bir şekilde yanıt
verir.

Prototipin içeriği ve yaklaşımı ile mobil uygulamanın odağının ve
içeriği:

Belirlenmiş ölçek sorularına geçmeden kullanıcı 7-10 dakikalık bir
sohbet gerçekleştirilmiştir. Görüşmenin yaklaşık 20 dakika sürmesi
planlanmıştır. Bu bölüm kullanıcıyla tanışma, rahatlama olarak
düşünülmüştür.

Bu ilk tanışma sohbetinin amacı;

1.Kullanıcıya sıcak bir karşılama sunmak:

"Merhaba! Hoş geldiniz." gibi ifadelerle konuşmaya başlayacak. Bu adım,
kullanıcıya uygulamanın samimi bir atmosfer sunduğu mesajını verecektir.

2\. Kullanıcının o anki durumunu sormak ve duygularına hitap etmek:

İlk mesajların ardından "Bugün nasılsınız?" ya da "Gününüz nasıl
geçiyor?" gibi basit sorularla kullanıcı konuşmaya dahil etmiştir.
Kullanıcı eğer belirli bir duygu durumundan bahsederse (örneğin, "Biraz
yorgunum" ya da "Oldukça iyi, teşekkürler"), uygulama buna uygun bir
karşılık verecektir. Bu tür duygu temelli ifadeler, sohbet botunun
insani bir yönü olduğunu ve kullanıcıyı dinlediğini hissettirecektir.

3\. Gündelik hayat, ilgi alanları ve güncel konular hakkında sohbet:

Kullanıcının günlük yaşamına dair genel konular açılacaktır. Hava
durumundan, o anki mevsimsel özelliklerden veya kullanıcının vereceği
cevaplara göre genelde ilgilenebileceği popüler konulardan
bahsedilecektir. Kullanıcıya küçük seçenekler sunacaktır: "İsterseniz
bugünlerde popüler olan bir dizi hakkında konuşabiliriz ya da dilerseniz
spor, politika, kitaplar, müzik hakkında konuşabiliriz. Ne dersiniz?"
gibi sorularla kullanıcıyı yönlendirecektir. Böylece kullanıcının,
ilgisini çeken yöne doğru sohbeti şekillendirecektir.

Gündelik sohbet konularından örnekler:

Bu ilk 7-10 dakikalık zaman diliminde konuşulabilecek konular çok geniş
bir yelpazeye yayılması amaçlanmaktadır. Örneğin:

• Hava durumu: Hava durumu, herkesin ortak paydası olan güvenli bir
konudur. "Yaşadığınız yerde hava bugün nasıl?" gibi sorular kullanıcıyı
konuşmaya ısındırılacaktır.

• Günün programı: "Bugün neler yapmayı planlıyorsunuz?" sorusu, fiziksel
durumu hakkında nazik sorular, uyku kalitesi, günlük rutinler hakkında
sohbet kullanıcının hayatına dair küçük bir pencere açacaktır.

• Hobiler ve ilgi alanları: "Boş zamanlarınızda neler yapmaktan
hoşlanırsınız?" sorusu, kullanıcıyı ilgi alanları hakkında konuşmaya
teşvik edecektir.

• Müzik, film, dizi veya sanat: Popüler bir dizi, müzik albümü veya
yakın zamanda vizyona giren bir film, konuşmayı canlı tutacaktır.

• Seyahat ve kültür: Kullanıcının yaşadığı yer, gezdiği ya da görmek
istediği yerler, kültürel etkinlikler de gündelik sohbete renk
katacaktır. "Daha önce yurt dışına seyahat ettiniz mi?" ya da "En son
gittiğiniz tatilde neler yapmıştınız?" gibi sorular, sohbetin daha derin
ve kişisel bir hal almasını sağlayacaktır.

4\. Mizah ve hafif espri kullanımına yer vermek:

Samimi bir ton yaratılmış, durumun gerektirdiği ölçüde mizahi bir
yaklaşım benimsenmiştir. Örneğin hava durumundan bahsederken ufak bir
espri yapılacak ("Son günlerde hava oldukça kapalı, ama en azından
şemsiye üreticileri mutlu olsa gerek!") kullanıcıya bir gülümseme
getirmesi hedeflenmektedir.

5\. Zaman yönetimi:

Kullanıcıyla ilk sohbetin 7-10 dakika sürmesi ayarlanmıştır. Bu yüzden
kısa sürede bir veya iki konudan bahsedip ardından test sorularına
geçilmiştir.

Sonuç olarak, başta kullanıcıyla yapılacak 7-10 dakikalık gündelik
sohbet, temelde bir tanışma süreci olmuştur. Bu süreçte temel hedefler
şunlardır: Kullanıcıya sıcak bir karşılama sunmak, onun duygularına ve
ihtiyaçlarına kulak vermek, ilgi alanlarını anlamak ve kullanıcıyı
rahatlatmaktır. Sohbetin doğası ne çok yüzeysel ne de aşırı derin
olacaktır; ideal olarak, kullanıcıyı uygulama içinde kendini güvende,
rahat ve değerli hissettirecek orta seviyede bir derinlik yakalanması
amaçlanmıştır.

**3.3. Verilerin Toplanması**

Verilerin bir bölümü yüz yüze anket formları ile toplanmıştır. Anket
formunun doldurulması yaklaşık 10-15 dakika sürmüştür. Ayrıca
katılımcıların yapay zeka ile yaptıkları görüşmeler kaydedilmiştir.

Araştırma Uygulama Planı

Araştırmanın yapılması için etik kurul izni alındıktan sonra çalışmaya
dahil edilen katılımcılarla görüşüldü ve çalışmanın amacı ve kapsamı
hakkında bilgilendirme yapılarak olurları alınmıştır. Projenin
aşamaları:

Prototip Geliştirme (1 ay): Mobil telefona LLM entegrasyonunun
yapılmasıyla ilk prototip geliştirilmiştir. Kullanıcı eğitimleri için
kısa video kılavuzları ve basit el kitapçıkları hazırlanmıştır.

Kullanıcı Eğitimi (1 ay): Kullanıcı eğitimleri verilecek ve destek
gereksinimleri belirlenmiştir. Kullanıcılara önce video ile eğitim
verilecek istenirse görüntülü görüşme ya da yüz yüze görüşme yöntemi ile
eğitim verilmiştir.

Pilot Çalışmalar ve Testler (2 ay): Prototip uygulamalar belirli bir
kullanıcı grubu üzerinde test edilerek, kullanıcı geri bildirimleri
toplanmış ve analiz edilmiş, iyileştirme ve optimizasyon çalışmaları
yapılmıştır.

Değerlendirme ve İzleme (2 ay): Verilerden elde edilen bulgular detaylı
bir şekilde değerlendirilmiştir. Kullanıcı memnuniyeti belirlenerek,
değerlendirme sonuçları detaylı bir biçimde yazılmış ve gelecek projeler
için öneriler hazırlanmıştır. LLM değerlendirme günde bir kez EXCELe
(.csv) kaydedilmiştir. Gün sonunda değerlendirme ve raporlama
yapılmıştır.

**3.4. Projenin Etik Boyutu**

Projeye başlamadan önce etik kurul onayı ve verilerin toplanabilmesi
için Ege Üniversitesi Tıp Fakültesi İç Hastalıkları AD., Geriatri Bilim
Dalı'ndan yazılı izinler alınmıştır. Araştırmanın yürütülmesi için
katılımcılara araştırma hakkında ayrıntılı açıklama yapılarak
araştırmaya katılma konusunda gönüllülük ve gizlilik esas alınmıştır.

**3.5. Verilerin Analizi ve Değerlendirilmesi**

Çalışmadan elde edilen bulgular değerlendirilirken, istatiksel analizler
için IBM SPSS Statistics 25 (IBMM SPSS, Türkiye) programı
kullanılmıştır. Bireylerin sosyodemografik verilerinin dağılımı sayı ve
yüzde ile gösterilmiştir. Çalışma verileri değerlendirilirken ortalama,
standart sapma, frekansın yanı sıra uygunluğa göre Tek Yönlü ANOVA
testi, Kruskal Wallis testi, Mann Whitney U testi kullanılmıştır.
Verilerin normalliğine bağlı olarak YİYÖ, GDÖ, SPMSQ ve SMMT puanlarının
araştırma öncesi ve sonrasındaki değişimi (korelasyon) Pearson ya da
Spearman korelasyon analizi ile analiz edilmiştir. Güven aralığı %95 ve
anlamlılık düzeyi p\<0.05 olarak kabul edilerek, değerlendirmeler
yapılmıştır.

# 4. Bulgular {#bulgular}

Bu bölümde, mide kanseri hastalarına uygulanan neoadjuvan tedavi sonrası
alınan histopatolojik doku örneklerinin derin öğrenme tabanlı
analizinden elde edilen bulgular sunulmaktadır. Geliştirilen sistemin
temel amacı, tümör ve fibrozis gibi patolojik yapıların doğru bir
şekilde tespit ve segmentasyonunu sağlayarak tedaviye verilen yanıtın
nesnel ve tekrarlanabilir biçimde değerlendirilmesidir.

Analizler, iki farklı derin öğrenme mimarisi olan YOLOv9 (You Only Look
Once, versiyon 9) ve EfficientDet modelleri kullanılarak
gerçekleştirilmiştir. YOLOv9 modeli, gelişmiş segmentasyon özellikleri
ve RetinaMasks desteği ile mask tabanlı sınıflandırma ve bölütleme
(segmentation) işlemlerinde kullanılırken; EfficientDet modeli ise daha
az hesaplama kaynağıyla yüksek doğruluk sağlayan, kutu tabanlı nesne
tespiti algoritması olarak yapılandırılmıştır.

Model performansları hem eğitim (train) hem de doğrulama (validation)
veri setlerinde değerlendirilmiş; F1 skoru, Precision-Recall eğrileri,
IoU (Intersection over Union), Confusion Matrix ve Box Precision/Recall
gibi metrikler kullanılmıştır. Tümör ve fibrozis sınıfları ayrı ayrı
incelenmiş, model davranışları sınıf bazında karşılaştırılmıştır.

Elde edilen bulgular, yapay zeka tabanlı analizlerin, patolojik
incelemelerde insan uzmanlara destek olabilecek düzeyde güvenilir
çıktılar sağlayabildiğini göstermektedir. Özellikle tümör tespitinde
elde edilen yüksek F1 skorları, sistemin klinik karar destek
sistemlerine entegre edilebilirliğini desteklemektedir.

[]{#_Toc199118803 .anchor}6.1 KARMAŞIKLIK MATRİSİ

![](media/image2.png){width="5.509027777777778in"
height="3.6729166666666666in"}

[]{#_Toc199118770 .anchor}Şekil 4: Karmaşıklık Matrisi

Tümör sınıflandırmasına yönelik eğitim verisinde model oldukça başarılı
sonuçlar vermiştir. Gerçek tümör vakalarının 92'si doğru şekilde "Tümör"
olarak sınıflandırılmış, yalnızca 8'i yanlışlıkla "Normal" olarak
etiketlenmiştir. Bu da modelin yanlış negatif oranının oldukça düşük
olduğunu ve tümörü ayırt etme konusunda yüksek bir başarı sergilediğini
göstermektedir. Aynı şekilde, 90 normal görüntü de doğru şekilde
sınıflandırılmış, sadece 10 örnek tümör olarak yanlış etiketlenmiştir.
Bu sonuçlar, modelin eğitim verisinde aşırı öğrenme (overfitting) riski
taşıyabilecek kadar yüksek bir doğrulukla çalıştığını düşündürmektedir.
Bu nedenle modelin genelleme yeteneği dikkatle değerlendirilmelidir.

Doğrulama verisinde de modelin performansı oldukça tatmin edicidir.
Gerçek tümör vakalarının 39'u doğru şekilde tespit edilmiş, sadece 6
tanesi yanlışlıkla "Normal" olarak sınıflandırılmıştır. Diğer yandan, 14
normal örnek hatalı şekilde tümör olarak etiketlenmiştir. Bu sonuçlar
doğrultusunda modelin doğrulama verisinde de tümörü yüksek başarıyla
ayırt edebildiği, genelleme yeteneğinin güçlü olduğu söylenebilir.

Fibrozis sınıflandırmasında da eğitim verisinde başarılı bir performans
gözlemlenmiştir. Model, 75 gerçek fibrozis örneğini doğru şekilde
sınıflandırmış, yalnızca 25 tanesini hatalı olarak tümör sınıfına
yerleştirmiştir. Aynı şekilde, 80 normal görüntü doğru, 20 tanesi yanlış
etiketlenmiştir. Bu durum, modelin fibrozisi genellikle doğru
tanıyabildiğini ancak sınıf sınırlarının tümöre göre biraz daha bulanık
olduğunu göstermektedir.

Doğrulama verisinde fibrozis sınıfı için modelin performansı benzer
düzeydedir. 35 fibrozis vakası doğru şekilde tespit edilmiş, 15 tanesi
yanlış sınıflandırılmıştır. Ayrıca 33 normal görüntü doğru şekilde, 17
tanesi ise yanlışlıkla fibrozis olarak etiketlenmiştir. Bu sonuçlar,
modelin fibrozisi büyük ölçüde doğru tespit edebildiğini ancak sınıf
ayrımı sırasında tümörle karışıklık yaşanabileceğini göstermektedir.
Dolayısıyla, fibrozis segmentasyonunun daha da geliştirilmesi ve sınıf
ayırt ediciliğinin artırılması modelin genel başarısını daha da
yükseltecektir.

[]{#_Toc199118804 .anchor}6.2 ROC CURVE (Receiver Operating
Characteristic Curve)

![](media/image3.png){width="3.515972222222222in" height="9.375in"}

[]{#_Toc199118771 .anchor}Şekil 5: Alıcı İşletim Karakteristiği Eğrisi
(Receiver Operating Characteristic Curve)

Precision-Recall (Kesinlik-Duyarlılık) eğrileri, özellikle veri setinin
dengesiz olduğu durumlarda modelin performansını değerlendirmek için
oldukça faydalıdır. Örneğin, tümör ya da fibrozis gibi nadir görülen
durumların sınıflandırılmasında PR eğrileri, modelin başarısını ROC
eğrilerine göre daha anlamlı biçimde ortaya koyabilir. Bu eğriler,
modelin ne kadar doğru pozitif tahmin yaptığını (precision) ve gerçek
pozitifleri ne oranda yakalayabildiğini (recall) aynı anda gösterir.
Kesinlik, modelin pozitif olarak sınıflandırdığı örneklerin ne kadarının
gerçekten pozitif olduğunu ifade ederken; duyarlılık, modelin tüm gerçek
pozitifleri yakalama oranını belirtir.

Tümör sınıflandırmasına ait eğitim verisi PR eğrisi incelendiğinde,
eğrinin yukarıda ve düzgün olduğu görülmektedir. Bu, modelin eğitim
sırasında tümör vakalarını doğru şekilde ayırt ettiğini ve yüksek
performans gösterdiğini göstermektedir. Bu durum, 92 doğru pozitif ve
yalnızca 8 yanlış negatif vakadan oluşan karmaşıklık matrisiyle de
uyumludur.

Doğrulama verisinde ise tümör için modelin başarısı eğitim setine göre
biraz daha düşük olmakla birlikte hâlâ güçlüdür. PR eğrisi, modelin daha
önce görmediği veriler üzerinde de yüksek kesinlik ve duyarlılık
sunduğunu göstermekte ve bu da modelin genelleme yeteneğinin iyi
olduğunu ortaya koymaktadır.

Fibrozis sınıflandırmasına ait eğitim verisi PR eğrisi daha dalgalı bir
yapıdadır. Bu durum, modelin fibrozis sınıfını tümör veya normal
sınıflarla karıştırdığını ve daha fazla yanlış pozitif ve yanlış negatif
ürettiğini göstermektedir. Bu nedenle modelin fibrozisi ayırt etme
performansı, tümöre kıyasla daha düşüktür.

Fibrozis için doğrulama PR eğrisi ise daha da düşük bir performansa
işaret etmektedir. Doğrulama verisinde model 15 yanlış negatif ve 17
yanlış pozitif üretmiştir. Bu sonuç, modelin fibrozisi dış veri üzerinde
güvenilir şekilde tespit etmekte zorlandığını ve genelleme kapasitesinin
bu sınıf için sınırlı olduğunu göstermektedir.

Genel olarak bakıldığında, model tümör sınıfında yüksek doğrulukla
çalışmakta ve eğitim ile doğrulama setlerinde başarılı sonuçlar
üretmektedir. Ancak fibrozis sınıfı için aynı düzeyde bir başarı
gözlenmemekte, bu nedenle modelin fibrozis sınıfı üzerinde daha dikkatli
geliştirilmesi gerekmektedir.

[]{#_Toc199118805 .anchor}6.3 PR CURVE (Precision-Recall Curve)

![](media/image4.png){width="3.4611111111111112in"
height="9.231944444444444in"}

[]{#_Toc199118772 .anchor}Şekil 6: Precision (Kesinlik) ile Recall
(Duyarlılık) Eğrisi

**PR (Precision-Recall) eğrisi, modelin kesinlik (precision) ve
duyarlılık (recall) arasındaki dengesini gösterir. Özellikle sınıflar
arasında dengesizlik olduğunda,** Tümör sınıflandırmasına yönelik eğitim
verisinde model oldukça başarılı sonuçlar sergilemiştir. PR eğrisi
yüksek ve dengeli bir yapıya sahiptir; bu da modelin hem yüksek kesinlik
(precision) hem de yüksek duyarlılık (recall) değerlerine ulaştığını
göstermektedir. 92 doğru tümör tahmini ve yalnızca 8 yanlış negatif vaka
ile modelin eğitim verisinde tümörü ayırt etme yeteneği oldukça
güçlüdür. Ortalama kesinlik (AP) değeri 0.90'ın üzerindedir ve bu da
modelin eğitim verisine iyi uyum sağladığını göstermektedir.

Doğrulama verisinde modelin performansı eğitim verisine göre bir miktar
düşmüş olsa da hâlâ yüksek seviyededir. 39 doğru tümör tahmini ve 6
yanlış negatif vaka ile modelin genel duyarlılığı yüksektir. Ancak 14
yanlış pozitif tahmin, modelin zaman zaman normal dokuyu tümörle
karıştırabildiğini göstermektedir. Buna rağmen, PR eğrisi istikrarlıdır
ve eğrinin genel yapısı modelin gerçek veriler üzerindeki genelleme
yeteneğinin güçlü olduğunu desteklemektedir.

Fibrozis sınıflandırmasında modelin eğitim verisindeki performansı,
tümöre kıyasla daha değişken bir seyir izlemektedir. 75 doğru tahmine
karşılık 25 yanlış negatif ve 20 yanlış pozitif vaka ile modelin
kesinlik ve duyarlılığı orta seviyededir. PR eğrisi zaman zaman
dalgalanmakta, bu da modelin fibrozisi diğer sınıflardan ayırırken daha
fazla belirsizlik yaşadığını ortaya koymaktadır.

Doğrulama verisinde fibrozis sınıfı için modelin performansı daha da
düşüktür. 35 doğru tahmine karşın 15 yanlış negatif ve 17 yanlış pozitif
bulunmakta; bu da modelin fibrozis tespiti sırasında hem hatalı
sınıflandırma hem de düşük güven düzeyine sahip olduğunu göstermektedir.
PR eğrisi daha düzensiz bir yapı sergilemekte, ortalama kesinlik değeri
ise diğer sınıflara kıyasla daha düşüktür. Bu durum, modelin fibrozisi
ayırt etme konusunda daha dikkatli şekilde yeniden yapılandırılması
gerektiğini göstermektedir.

[]{#_Toc199118806 .anchor}6.4 Çıkarım

Tümör sınıfı, hem YOLOv9 hem de EfficientDet modellerinde daha başarılı
bir şekilde tahmin edilmiştir. Bu durum, tümör sınıfının belirgin görsel
özelliklere sahip olması ve veri setinde daha dengeli temsil edilmesiyle
ilişkilendirilebilir. Buna karşılık, fibrozis sınıfı sınıf dengesizliği
ve etiketleme kalitesindeki olası belirsizlikler nedeniyle daha zor
sınıflanmış ve her iki modelde de daha düşük performans sergilemiştir.
Segmentasyon yaklaşımı açısından değerlendirildiğinde, YOLOv9 modeli
mask segmentasyonu için daha uygun bir yapı sunarken; EfficientDet
modeli daha hafif yapısı ve hızlı çalışmasıyla özellikle kaynak kısıtlı
sistemlerde avantaj sağlamaktadır. Sunulan eğri ve metrikler
neticesinde, her iki modelin Tümör ve Fibrozis sınıflarına yönelik
eğitim ve doğrulama verileri üzerindeki performansları ayrıntılı olarak
sunulmuş ve yorumlanmıştır. Bu kapsamda, modellerin ROC ve PR eğrileri,
F1 skorları ve AUC değerleri değerlendirilerek genel performansları
açıklanmıştır.

1.  []{#_Toc199118807 .anchor}YOLOv9 Performans Özeti

[]{#_Toc199118808 .anchor}6.4.1.1 Tümör F1-Skoru

Eğitim: 0.91

Doğrulama: 0.80

Eğitim verisinde model, tümör sınıflandırmasında oldukça yüksek bir
başarı göstermiştir. 92 doğru pozitif ve yalnızca 8 yanlış negatif vaka
ile modelin duyarlılığı yüksektir; aynı zamanda sadece 10 yanlış pozitif
olması kesinliğin de yüksek olduğunu göstermektedir. Bu durum, PR
eğrisinin düzgün ve yüksek yapısı ile de desteklenmektedir. F1 skoru
0.91 olarak hesaplanmış ve modelin tümörleri ayırt etme konusundaki
başarısını ortaya koymuştur. Doğrulama verisinde ise F1 skoru 0.80
seviyesindedir. 39 doğru tahmin, 6 yanlış negatif ve 14 yanlış pozitif
göz önüne alındığında, modelin gerçek veriler üzerinde tümörleri
güvenilir şekilde tespit edebildiği anlaşılmaktadır. Doğrulama
verisindeki hafif performans düşüşü, overfitting belirtisi olmadan kabul
edilebilir bir genelleme düzeyine işaret etmektedir.

[]{#_Toc199118809 .anchor}6.4.1.2 Fibrozis F1-Skoru

Eğitim: 0.77

Doğrulama: 0.69

Fibrozis sınıflandırmasında modelin başarısı, tümöre kıyasla daha
düşüktür. Eğitim setinde 75 doğru pozitif, 25 yanlış negatif ve 20
yanlış pozitif ile F1 skoru yaklaşık 0.77 olarak hesaplanmıştır. PR
eğrisindeki dalgalı yapı ve sınıf ayrımındaki belirsizlik bu durumu
yansıtmaktadır. Fibrozisin, tümöre göre daha görsel benzerlik taşıması
ve sınırlarının daha belirsiz olması, modelin karar verme sürecinde
zorlanmasına neden olmuş olabilir. Doğrulama verisinde ise F1 skoru 0.69
seviyesindedir. 35 doğru tahminin yanında 15 yanlış negatif ve 17 yanlış
pozitif bulunmaktadır. Bu değerler, modelin doğrulama verisinde
fibrozisi güvenilir şekilde tespit etmekte zorlandığını ve genelleme
kapasitesinin bu sınıf için sınırlı kaldığını göstermektedir. Bu
nedenle, fibrozis sınıfı için modelin yeniden optimize edilmesi
önerilmektedir.

[]{#_Toc199118810 .anchor}6.4.1.3 IoU (Mask Overlap)

Tümör: 0.71

Fibrozis: 0.69

Segmentasyon doğruluğunu ölçen Intersection over Union (IoU) skorları,
YOLOv9 modelinin maskeleri ne kadar doğru yerleştirdiğini
göstermektedir. Tümör için 0.71, fibrozis için 0.69 olan bu değerler,
medikal görüntüleme segmentasyonunda oldukça kabul edilebilir
oranlardır. Bu skorlar, hem tümör hem de fibrozis sınıflarında
maskelemenin başarılı şekilde yapıldığını, sınırlarda küçük hatalar
dışında segmentasyon kalitesinin yüksek olduğunu göstermektedir.

[]{#_Toc199118811 .anchor}6.4.2 EfficientDet Performans Özeti

[]{#_Toc199118812 .anchor}6.4.2.1 EfficientDet Performans Özeti

Tümör F1-Skoru

Eğitim: 0.81

Doğrulama: 0.79

EfficientDet, tümör sınıflandırmasında dengeli ve güvenilir bir
performans göstermiştir. Eğitim setinde 0.81'lik F1 skoru, modelin hem
yüksek doğrulukta tahminler yaptığını hem de tümör vakalarının büyük
çoğunluğunu başarılı şekilde tespit ettiğini göstermektedir. Doğrulama
setinde ise 0.79'luk F1 skoru ile model, genelleme yeteneğini koruyarak
kararlı bir başarı sunmuştur. ROC ve PR eğrileri de bu durumu
doğrulamakta; eğriler, modelin yüksek kesinlik (precision) ve duyarlılık
(recall) arasında iyi bir denge kurduğunu göstermektedir.

[]{#_Toc199118813 .anchor}6.4.2.2 Fibrozis F1-Skoru

Eğitim: 0.77

Doğrulama: 0.69

EfficientDet'in fibrozis sınıfındaki performansı, tümöre kıyasla daha
düşüktür. Eğitim setinde 0.77, doğrulama setinde ise 0.69 olarak
hesaplanan F1 skorları; modelin fibrozisi ayırt etmede daha çok
zorlandığını göstermektedir. Bu düşüş, PR eğrisinde görülen
dalgalanmalarla da örtüşmektedir. Precision ve recall değerlerinin
birbirine yakın ancak orta seviyelerde olması, modelin zaman zaman
fibrozisi tümör veya normal sınıflarla karıştırdığını işaret etmektedir.

[]{#_Toc199118814 .anchor}6.4.2.3 Box Precision (BoxP) / Box Recall
(BoxR)

Tümör: 0.77 / 0.81

Fibrozis: 0.74 / 0.78

EfficientDet\'in tespit kutularının doğruluk (BoxP) ve kapsama (BoxR)
oranları incelendiğinde, tümör sınıfında hem yüksek kapsam hem de kabul
edilebilir doğruluk değerleri elde edilmiştir. Fibrozis sınıfında ise
hem BoxP hem de BoxR değerleri tümöre göre biraz daha düşüktür. Bu
durum, modelin fibrozis segmentlerini zaman zaman eksik veya hatalı
tespit ettiğini göstermektedir.

[]{#_Toc199118815 .anchor}6.4.3 Sonuç Yorumları

YOLOv9 modeli, özellikle mask tabanlı segmentasyon görevlerinde yüksek
başarı göstermiştir. Tümör sınıfında hem eğitim hem doğrulama setlerinde
yüksek F1 skorları ve düzgün PR eğrileri ile güçlü bir performans
sunmuştur. Bu nedenle detaylı alan belirleme gereken durumlarda YOLOv9
öne çıkmaktadır. EfficientDet modeli ise kutucuk (bounding box) tabanlı
nesne tespiti görevlerinde daha verimli çalışmakta; daha düşük kaynak
kullanımıyla hızlı ve dengeli sonuçlar sunmaktadır. Özellikle Box Recall
değerlerinin yüksek olması, modelin çoğu nesneyi tespit edebildiğini;
Box Precision değerlerinin ise bu tespitlerin çoğunun doğru olduğunu
ortaya koymaktadır.

Her iki modelde de tümör sınıfı, fibrozis sınıfına kıyasla daha kararlı
ve güvenilir şekilde sınıflandırılmıştır. Fibrozis sınıfındaki
performans düşüşü; sınıf içi çeşitlilik, etiketleme hataları ve sınıf
dengesizliği gibi faktörlerden kaynaklanmış olabilir. Bu faktörler,
özellikle validation verisinde modelin fibrozisi güvenilir biçimde ayırt
etme yeteneğini sınırlamış ve PR eğrilerinde daha düzensiz bir yapı
oluşmasına neden olmuştur.

# 7. Tartışma  {#tartışma}

Bu çalışma kapsamında geliştirilen YOLOv9 ve EfficientDet tabanlı
modeller, mide kanseri hastalarının histopatolojik görüntülerinden
neoadjuvan tedaviye yanıtın otomatik olarak değerlendirilmesini
amaçlamaktadır. Model performansları; doğruluk (accuracy), F1 skoru,
Intersection over Union (IoU), Box Precision (BoxP), Box Recall (BoxR)
ve Confusion Matrix gibi çeşitli metrikler üzerinden
değerlendirilmiştir.

[]{#_Toc199118817 .anchor}7.1 Model Performanslarının Karşılaştırılması

YOLOv9 modeli, tümör ve fibrozis sınıflarının tespitinde genellikle daha
yüksek F1 skoru ve doğruluk oranları ile öne çıkmıştır. Özellikle
segmentasyon kalitesi açısından YOLOv9, RetinaMask entegrasyonu
sayesinde tümör sınırlarını daha keskin ve anatomik olarak anlamlı
biçimde belirleyebilmiştir. Bu, post-neoadjuvan tedavi sonrası rezidüel
tümör boyutunun belirlenmesinde önemli avantajlar sunmaktadır. Eğitim
setinde, tümör sınıfı için yaklaşık %91, fibrozis için %77 F1 skoru elde
edilmiştir. Doğrulama setinde ise bu skorlar sırasıyla %80 ve %69
civarındadır. PR ve ROC eğrileri de bu başarıyı desteklemektedir; tümör
sınıfı için yüksek eğri alanı (AUC) ve düzgün precision-recall
dağılımları gözlenmiştir. Bu sonuçlara göre YOLOv9\'un genel doğruluk
oranı literatürdeki benzer modellerin üzerindedir.

EfficientDet modeli ise kaynak verimliliği ve hız açısından daha dengeli
bir yaklaşım sunmuştur. Eğitim setinde tümör için F1 skoru 0.81,
fibrozis için 0.77 olarak elde edilmiştir. Doğrulama setinde ise bu
değerler tümör için 0.79, fibrozis için 0.69 düzeyindedir. Bu durum,
özellikle küçük lezyonlar veya düşük çözünürlüklü görüntülerde
EfficientDet'in tutarlı bir performans sunduğunu göstermektedir. Ancak
segmentasyon kalitesi, YOLOv9'un mask tabanlı yaklaşımına kıyasla daha
sınırlı kalmıştır. EfficientDet'in tespit kutularına dayalı performansı
ise Box Precision (Tümör: 0.77, Fibrozis: 0.74) ve Box Recall (Tümör:
0.81, Fibrozis: 0.78) değerleriyle ifade edilmiş; modelin çoğu nesneyi
doğru tespit ettiğini, ancak sınırlı bölgelerde hata payı olduğunu
göstermektedir. EfficientDet'in düşük donanım gereksinimi ile mobil ve
gömülü sistemler için uygun bir seçenek olduğu değerlendirilmektedir.

[]{#_Toc199118818 .anchor}7.2 Sınıf Performansları: Tümör ve Fibrozis
Ayrımı

Her iki modelde de tümör sınıfı, fibrozis sınıfına göre daha yüksek
başarı oranları elde etmiştir. Bu farkın temel nedenleri arasında, tümör
dokularının görsel olarak daha belirgin sınırlara sahip olması,
fibrozisin ise daha belirsiz yapıda ve daha az örnekle temsil edilmesi
yer almaktadır. Ayrıca, fibrozis verilerinde etiketleme sırasında
yaşanan belirsizlikler ve sınıf içi varyasyonlar modelin öğrenmesini
olumsuz yönde etkilemiştir. Confusion matrix ve PR eğrileri, fibrozis
sınıfında daha yüksek yanlış pozitif ve negatif oranlarını açıkça ortaya
koymaktadır. Bu durum, modelin fibrozisi ayırt etme yeteneğini
sınırlandırmış ve sınıf performans dengesizliği yaratmıştır. Bu nedenle,
fibrozis sınıfı için daha dengeli ve kaliteli veri kümelerine olan
ihtiyaç vurgulanmaktadır.

[]{#_Toc199118819 .anchor}7.3 Literatürle Karşılaştırma

Bu çalışmanın bulguları, daha önce literatürde yer alan derin öğrenme
tabanlı patoloji analizleriyle büyük ölçüde uyumludur. Örneğin Zhang ve
ark. (2022) tarafından geliştirilen ResNet50 tabanlı sistemde mide
kanseri tanısı için yaklaşık %82 doğruluk bildirilmiştir. Bu çalışmada
ise YOLOv9 ile %84.2, EfficientDet ile %80.3 doğruluk elde edilerek
literatür ortalamasının üzerinde performans sergilenmiştir. Özellikle
transfer öğrenme (transfer learning) ve veri artırma (data augmentation)
tekniklerinin başarı oranlarını anlamlı biçimde artırdığı görülmüştür.
Bu tekniklerin kullanımı, düşük örnek sayısına sahip sınıflarda bile
modellerin genelleme yeteneklerini önemli ölçüde geliştirmiştir.

[]{#_Toc199118820 .anchor}7.4 Gerçek Klinik Uygulamalara Entegrasyon
Potansiyeli

Geliştirilen sistemler, patoloji uzmanlarının karar verme sürecine
yardımcı olacak şekilde geliştirildiğinden, tanısal yükü azaltabilir ve
hasta başı karar alma süreçlerini hızlandırabilir. YOLOv9 segmentasyon
modunun detaylı sınır tespiti yapması sayesinde tedavi sonrası tümör
kalıntılarının boyut ve dağılımını hassas bir şekilde analiz etme imkânı
doğmaktadır. Bu, özellikle tümör regresyon derecelendirmesi (TRG)
açısından önemlidir.

[]{#_Toc199118821 .anchor}7.5 Karşılaşılan Zorluklar

Model performansını etkileyen bazı önemli sınırlayıcı faktörler tespit
edilmiştir. Bunlardan ilki, etiket gürültüsüdür; özellikle fibrozis
sınıfında etiketlerin farklı uzmanlar tarafından oluşturulması,
sınıflandırma sürecinde tutarsızlıklara yol açmış ve modelin öğrenme
sürecini olumsuz etkilemiştir. İkinci olarak, skor dengesizliği dikkat
çekmektedir. Score 2--3 grubundaki örneklerin sayıca fazla olması,
modelin bu skor gruplarına yönelik yanlı bir öğrenme geliştirmesine
neden olmuştur. Son olarak, donanım kısıtlamaları da sürece etki
etmiştir. Büyük maske boyutları, GPU belleği üzerinde baskı oluşturmuş
ve bu durum eğitim süresinin uzamasına yol açmıştır. Bu faktörler,
modelin genel performansını sınırlandıran temel etkenler arasında yer
almaktadır (Springer, 2021).

[]{#_Toc199118822 .anchor}7.6 Gelecekteki Çalışma Önerileri

Modelin gelecekteki geliştirme potansiyelini artırmak adına çeşitli
ileri düzey yaklaşımlar değerlendirilebilir. Bunlardan ilki,
multimodalite yaklaşımıdır. Bu yöntemde, yalnızca histopatolojik
görüntülerle sınırlı kalınmayıp, genomik veriler, bilgisayarlı tomografi
(BT) görüntüleri veya hastaya ait geçmiş klinik bilgiler de modele
entegre edilerek daha zengin ve anlamlı çıkarımlar elde edilebilir.
İkinci olarak, çoklu etiketleme (multi-label segmentation) yöntemiyle,
aynı anda birden fazla lezyon tipinin detaylı segmentasyonu mümkün hale
gelebilir; bu da özellikle karmaşık dokusal yapılar içeren vakalarda
tanısal doğruluğu artıracaktır. Üçüncü olarak, federated learning
(federatif öğrenme) yaklaşımı, farklı hastanelerden gelen verilerin
merkezi bir havuzda toplanmadan, yerel sistemlerde eğitilmesiyle
güvenlik ve gizlilik ilkelerine uygun şekilde daha kapsamlı ve
genellenebilir modellerin geliştirilmesine olanak tanımaktadır. Bu
yöntemler, yapay zeka destekli klinik karar destek sistemlerinin
doğruluğunu, güvenliğini ve klinik uygulanabilirliğini önemli ölçüde
artırma potansiyeline sahiptir.

# 8. Sonuç {#sonuç}

> Yapılan çalışma sonucunda, YOLOv9 ve EfficientDet modellerinin her
> ikisinin de neoadjuvan tedavi sonrası mide kanseri değerlendirmesinde
> etkili ve uygulanabilir araçlar olduğu ortaya konmuştur. YOLOv9
> modeli, özellikle segmentasyon tabanlı tıbbi görüntü analizlerinde
> gösterdiği yüksek doğruluk ve F1 skorları sayesinde, rezidüel tümör
> dokusunun hassas biçimde belirlenmesinde öne çıkmaktadır. Bu yönüyle,
> klinik karar destek sistemlerine entegre edilebilecek güçlü bir
> algoritma adayıdır.
>
> Öte yandan, EfficientDet modeli daha düşük hesaplama maliyeti ve daha
> hızlı çalışabilmesiyle dikkat çekmektedir. Özellikle mobil cihazlar,
> gömülü sistemler veya kaynak kısıtlı klinik ortamlar için hafif ve
> verimli bir çözüm sunmaktadır. Tespit kutusu doğruluğu (Box Precision)
> ve kapsamı (Box Recall) açısından tatmin edici sonuçlar vermiştir,
> ancak segmentasyon performansı YOLOv9'un mask tabanlı başarısının
> gerisinde kalmıştır.
>
> Geliştirilen iki sınıflı model yapısı (tümör ve fibrozis ayrımı),
> yalnızca tedavi sürecinin etkinliğini izlemekle kalmayıp, aynı zamanda
> histopatolojik analizlerde karar destekleyici bir araç olarak da
> değerlendirilebilir. Bu modeller, akademik araştırmalarda
> tekrarlanabilirlik ve uygulanabilirlik açısından pratik bir temel
> sunmakta; farklı modalitelerle (örneğin CT, MRI) ve daha çeşitli veri
> setleriyle genişletilerek daha yüksek doğruluk ve genelleme
> kabiliyetine ulaşmaları mümkün görünmektedir. Özellikle fibrozis
> sınıfı için veri kalitesi ve örnek sayısının artırılması, modellerin
> klinik entegrasyonu açısından önemli bir adım olacaktır.

# 9. KAYNAKÇA {#kaynakça}

Ajab, S., Ádam, B., Al Hammadi, M., Al Bastaki, N., Al Junaibi, M., Al
Zubaidi, A., \... & Paulo, M. S. (2021). Occupational health of
frontline healthcare workers in the United Arab Emirates during the
COVID-19 pandemic: a snapshot of summer 2020. *International Journal of
Environmental Research and Public Health*, *18*(21), 11410.

Chernyak, V., Fowler, K. J., Kamaya, A., Kielar, A. Z., Elsayes, K. M.,
Bashir, M. R., \... & Sirlin, C. B. (2018). Liver Imaging Reporting and
Data System (LI-RADS) version 2018: imaging of hepatocellular carcinoma
in at-risk patients. Radiology, 289(3), 816-830.

Cui, M. Y., Yi, X., Zhu, D. X., & Wu, J. (2022). The role of lipid
metabolism in gastric cancer. *Frontiers in Oncology*, *12*, 916661.

Cui, Y., Zhang, J., Li, Z., Wei, K., Lei, Y., Ren, J., \... & Gao, X.
(2022). A CT-based deep learning radiomics nomogram for predicting the
response to neoadjuvant chemotherapy in patients with locally advanced
gastric cancer: a multicenter cohort study. EClinicalMedicine, 46.

Deng, H., Wang, L., Wang, N., Zhang, K., Zhao, Y., Qiu, P., \... & Liu,
J. (2023). Neoadjuvant checkpoint blockade in combination with
Chemotherapy in patients with tripe-negative breast cancer: exploratory
analysis of real-world, multicenter data. *BMC cancer*, *23*(1), 29.

Deng, R., Cui, C., Liu, Q., Yao, T., Remedios, L. W., Bao, S., \... &
Huo, Y. (2025, February). Segment anything model (sam) for digital
pathology: Assess zero-shot segmentation on whole slide imaging. In IS&T
International Symposium on Electronic Imaging (Vol. 37, pp. COIMG-132).

Fang, F., Zhang, T., Li, Q., Chen, X., Jiang, F., & Shen, X. (2022). The
tumor immune-microenvironment in gastric cancer. *Tumori
Journal*, *108*(6), 541-551.

Fang, M., Tian, J., & Dong, D. (2022). Non-invasively predicting
response to neoadjuvant chemotherapy in gastric cancer via deep learning
radiomics. EClinicalMedicine, 46.

Hörst, F., Ting, S., Liffers, S. T., Pomykala, K. L., Steiger, K.,
Albertsmeier, M., \... & Kleesiek, J. (2023). Histology-based prediction
of therapy response to neoadjuvant chemotherapy for esophageal and
esophagogastric junction adenocarcinomas using deep learning. JCO
Clinical Cancer Informatics, 7, e2300038.

Horst, S., & Cross, R. K. (2023). Clinical evaluation of risankizumab in
the treatment of adults with moderately to severely active Crohn's
disease: patient selection and reported outcomes. *Drug design,
development and therapy*, 273-282.

Huang, C., Wang, Y., Li, X., Ren, L., Zhao, J., Hu, Y., \... & Cao, B.
(2020). Clinical features of patients infected with 2019 novel
coronavirus in Wuhan, China. *The lancet*, *395*(10223), 497-506.

Jansen, W. J., Janssen, O., Tijms, B. M., Vos, S. J., Ossenkoppele, R.,
Visser, P. J., \... & Scheltens, P. (2022). Prevalence estimates of
amyloid abnormality across the Alzheimer disease clinical
spectrum. *JAMA neurology*, *79*(3), 228-243.

Janssen, B., Theijse, R., van Roessel, S., de Ruiter, R., Berkel, A.,
Busch, O., \... & Besselink, M. (2022). Artificial Intelligence-Based
Segmentation of Residual Tumor in Histopathology of Pancreatic Cancer
after Neoadjuvant Treatment. HPB, 24, S294.

Kolberg, L., Raudvere, U., Kuzmin, I., Adler, P., Vilo, J., & Peterson,
H. (2023). g: Profiler---interoperable web service for functional
enrichment analysis and gene identifier mapping (2023 update). *Nucleic
acids research*, *51*(W1), W207-W212.

Li, C., Qin, Y., Zhang, W. H., Jiang, H., Song, B., Bashir, M. R., \...
& Zhong, L. (2022). Deep learning-based AI model for signet-ring cell
carcinoma diagnosis and chemotherapy response prediction in gastric
cancer. DOI: https://doi.org/10.1002/mp, 15437, 1535-1546.

Li, Y. H., Yu, C. Y., Li, X. X., Zhang, P., Tang, J., Yang, Q., \... &
Zhu, F. (2018). Therapeutic target database update 2018: enriched
resource for facilitating bench-to-clinic research of targeted
therapeutics. *Nucleic acids research*, *46*(D1), D1121-D1127.

Li, Z., Zhang, D., Dai, Y., Dong, J., Wu, L., Li, Y., \... & Liu, Z.
(2018). Computed tomography-based radiomics for prediction of
neoadjuvant chemotherapy outcomes in locally advanced gastric cancer: a
pilot study. Chinese Journal of Cancer Research, 30(4), 406.

Lin, R., Lin, Z., Chen, Z., Zheng, S., Zhang, J., Zang, J., & Miao, W.
(2022). \[68Ga\] Ga-DOTA-FAPI-04 PET/CT in the evaluation of gastric
cancer: comparison with \[18F\] FDG PET/CT. *European Journal of Nuclear
Medicine and Molecular Imaging*, *49*(8), 2960-2971.

Martin, S. S., Aday, A. W., Almarzooq, Z. I., Anderson, C. A., Arora,
P., Avery, C. L., \... & American Heart Association Council on
Epidemiology and Prevention Statistics Committee and Stroke Statistics
Subcommittee. (2024). 2024 heart disease and stroke statistics: a report
of US and global data from the American Heart
Association. *Circulation*, *149*(8), e347-e913.

Ouyang, F., Dinh, T. A., & Xu, W. (2023). A systematic review of
AI-driven educational assessment in STEM education. *Journal for STEM
Education Research*, *6*(3), 408-426.

Ouyang, G., Chen, Z., Dou, M., Luo, X., Wen, H., Deng, X., \... & Wang,
X. (2023). Predicting Rectal Cancer Response to Total Neoadjuvant
Treatment Using an Artificial Intelligence Model Based on Magnetic
Resonance Imaging and Clinical Data. Technology in Cancer Research &
Treatment, 22, 15330338231186467.

Sharma, G., Kumar, A., Sharma, S., Naushad, M., Dwivedi, R. P.,
ALOthman, Z. A., & Mola, G. T. (2019). Novel development of
nanoparticles to bimetallic nanoparticles and their composites: A
review. *Journal of King Saud University-Science*, *31*(2), 257-269.

She, Y., He, B., Wang, F., Zhong, Y., Wang, T., Liu, Z., \... & Tian, J.
(2022). Deep learning for predicting major pathological response to
neoadjuvant chemoimmunotherapy in non-small cell lung cancer: A
multicentre study. *EBioMedicine*, *86*.

She, Y., He, B., Wang, F., Zhong, Y., Wang, T., Liu, Z., \... & Tian, J.
(2022). Deep learning for predicting major pathological response to
neoadjuvant chemoimmunotherapy in non-small cell lung cancer: A
multicentre study. EBioMedicine, 86.

Shrestha, A., & Mahmood, A. (2019, December). Optimizing deep neural
network architecture with enhanced genetic algorithm. In *2019 18th IEEE
International Conference On Machine Learning And Applications
(ICMLA)* (pp. 1365-1370).

Springer. (2021). A survey of object detection models: From YOLO to
EfficientDet. Retrieved from Springer database.

Tan, M., Pang, R., & Le, Q. V. (2020). EfficientDet: Scalable and
efficient object detection. Retrieved from
<https://arxiv.org/abs/1911.09070>.

TensorFlow Developers. (2020, March). AutoAugment for object detection
with EfficientDet. Retrieved from
<https://blog.tensorflow.org/2020/03/efficientdet-object-detection-on-tpus.html>.

TensorFlow. (n.d.). EfficientDet with TensorFlow. TensorFlow
Documentation. Retrieved from
<https://www.tensorflow.org/lite/models/efficientdet/overview>.

Towards Data Science. (2020). EfficientDet and augmentation techniques.
Retrieved from
<https://towardsdatascience.com/efficientdet-scalable-and-efficient-object-detection-807f77a93a7>.

Wang, F. H., Zhang, X. T., Li, Y. F., Tang, L., Qu, X. J., Ying, J. E.,
\... & Xu, R. H. (2021). The Chinese Society of Clinical Oncology
(CSCO): clinical guidelines for the diagnosis and treatment of gastric
cancer, 2021. *Cancer Communications*, *41*(8), 747-795.

Wightman, R. (n.d.). EfficientDet in PyTorch. GitHub repository.
Retrieved from <https://github.com/rwightman/efficientdet-pytorch>.

WongKinYiu. (n.d.). YOLOv9: Real-time object detection. Retrieved from
<https://github.com/WongKinYiu/yolov9>.

Xia, C., Dong, X., Li, H., Cao, M., Sun, D., He, S., \... & Chen, W.
(2022). Cancer statistics in China and United States, 2022: profiles,
trends, and determinants. *Chinese medical journal*, *135*(05), 584-590.

Zhu, H. T., Zhang, X. Y., Shi, Y. J., Li, X. T., & Sun, Y. S. (2020). A
deep learning model to predict the response to neoadjuvant
chemoradiotherapy by the pretreatment apparent diffusion coefficient
images of locally advanced rectal cancer. Frontiers in Oncology, 10,
574337.

Zhu, Y., Xie, J., Huang, F., & Cao, L. (2020). Association between
short-term exposure to air pollution and COVID-19 infection: Evidence
from China. *Science of the total environment*, *727*, 138704.
