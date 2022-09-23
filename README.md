# gcr-mongodump

Proyek ini bertujuan membuat suatu servis dengan platform Google Cloud Run yang digunakan untuk melakukan backup data mongodb ke Google Cloud Storage (nearline).

## Penggunaan
1. Membuat Bucket di GCS yang digunakan untuk penyimpanan
2. Membuat service account
3. Melakukan konfigurasi permission di bucket agar service account tersebut dapat mengakses bucket.
4. Menyiapkan json credential dari service account di dalam folder `credentials`