# Milestone 5 - Face Analysis Engine

## Rencana Implementasi
1. Buat arsitektur modul Face Analysis dengan pemisahan layer:
   - UI Layer
   - Application Layer
   - Domain Layer
   - Infrastructure Layer
2. Domain: definisikan type/kontrak dan implementasi perhitungan + klasifikasi (rule-based) + confidence.
3. Infrastructure: implement adapter penyimpanan ke database Supabase untuk `face_analysis`.
4. Application: buat service/use-case yang mengorkoordinasikan:
   - perhitungan ukuran (melalui engine interface)
   - klasifikasi
   - persistence
5. UI: buat halaman/component scaffold yang memanggil application service (tanpa MediaPipe langsung).
6. Tambahkan implementasi adapter MediaPipe engine (nanti setelah UI scaffold siap), sehingga UI tidak bergantung pada MediaPipe.
7. Tambahkan testing checklist (unit + integrasi + manual) dan scaffolding test bila repo sudah punya setup.
8. Validasi build dan lint.

