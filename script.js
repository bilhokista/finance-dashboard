// ===== GLOBAL VARIABLES =====
let financialData = null;
let charts = {};

// Sample data for testing
const sampleData = {
    monthly: [
        { bulan: 'Jan', pendapatan: 45000000, pengeluaran: 38000000, laba: 7000000 },
        { bulan: 'Feb', pendapatan: 48000000, pengeluaran: 39500000, laba: 8500000 },
        { bulan: 'Mar', pendapatan: 52000000, pengeluaran: 41000000, laba: 11000000 },
        { bulan: 'Apr', pendapatan: 49000000, pengeluaran: 40000000, laba: 9000000 },
        { bulan: 'May', pendapatan: 53000000, pengeluaran: 42500000, laba: 10500000 },
        { bulan: 'Jun', pendapatan: 55000000, pengeluaran: 43000000, laba: 12000000 }
    ],
    kategoriPengeluaran: [
        { kategori: 'Sewa', jumlah: 12000000 },
        { kategori: 'Gaji', jumlah: 18000000 },
        { kategori: 'Pemasaran', jumlah: 5000000 },
        { kategori: 'Utilitas', jumlah: 2500000 },
        { kategori: 'Suplai', jumlah: 3500000 },
        { kategori: 'Lainnya', jumlah: 2000000 }
    ],
    ketidakefisienan: [
        { nama: 'Biaya Marketing Tinggi', nilai: '10.5%', tingkat: 'sedang', deskripsi: 'Biaya marketing di atas rata-rata industri' },
        { nama: 'Penghasilan Per Karyawan Rendah', nilai: 'Rp8.700.000', tingkat: 'tinggi', deskripsi: 'Di bawah standar industri Rp12.000.000 per karyawan' },
        { nama: 'Biaya Variabel Tinggi', nilai: '35%', tingkat: 'rendah', deskripsi: 'Sedikit di atas rentang optimal (30-33%)' }
    ],
    improvements: [
        { title: 'Mengurangi Biaya Pemasaran', deskripsi: 'Pertimbangkan mengalokasikan anggaran ke saluran yang lebih efektif', tindakan: 'Tinjau ROI saluran pemasaran' },
        { title: 'Meningkatkan Produktivitas Karyawan', deskripsi: 'Penghasilan per karyawan di bawah rata-rata industri', tindakan: 'Tinjau proses kerja dan pelatihan' },
        { title: 'Mengoptimalkan Manajemen Inventaris', deskripsi: 'Inventaris saat ini di bawah tingkat optimal', tindakan: 'Menerapkan sistem inventaris just-in-time' }
    ],
    financialCharacter: {
        type: 'Pertumbuhan Seimbang',
        deskripsi: 'Bisnis Anda menunjukkan pendekatan yang seimbang dengan fokus pertumbuhan yang sedang dan toleransi risiko yang wajar, sambil tetap mempertahankan efisiensi yang wajar.',
        traits: {
            riskTolerance: 65,
            growthFocus: 70,
            efficiency: 55
        }
    }
};

// ===== FORMAT CURRENCY FUNCTION =====
function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0, // No decimal places for Rupiah
    }).format(value);
}

// ===== DOM ELEMENTS =====
const navLinks = document.querySelectorAll('nav ul li a');
const sections = document.querySelectorAll('main section');
const fileUpload = document.getElementById('file-upload');
const fileInfo = document.getElementById('file-info');
const importBtn = document.getElementById('import-btn');
const sampleDataBtn = document.getElementById('sample-data-btn');
const templateBtn = document.getElementById('template-btn');

// Add date utilities
const dateUtils = {
    formatDate: (dateStr) => {
        const date = new Date(dateStr);
        if (isNaN(date)) return 'Tanggal Invalid';
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    parseDate: (dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(dateStr);
    },
    isValidDate: (date) => {
        return date instanceof Date && !isNaN(date);
    }
};

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Safely initialize elements
    const initListener = (selector, event, handler) => {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(event, handler);
    };

    // Modal buttons
    initListener('#start-analysis', 'click', () => {
        document.getElementById('landing-modal').classList.remove('active');
        document.querySelector('a[href="#import"]').click();
    });

    initListener('#learn-more', 'click', () => {
        document.getElementById('landing-modal').classList.remove('active');
        document.querySelector('a[href="#about"]').click();
    });

    // Navigation
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // File handling
    initListener('#file-upload', 'change', handleFileSelect);
    initListener('#import-btn', 'click', processUploadedFile);
    initListener('#sample-data-btn', 'click', loadSampleData);
    initListener('#template-btn', 'click', downloadTemplate);
    
    // Budget and scenario
    initListener('#set-budget-btn', 'click', setBudget);
    initListener('#analyze-scenario-btn', 'click', analyzeScenario);
    initListener('#calculate-cash-flow-btn', 'click', calculateCashFlow);
    initListener('#submit-feedback-btn', 'click', submitFeedback);

    // Set landing page as default active section
    document.querySelector('#landing').classList.add('active-section');
    document.querySelector('#landing').classList.remove('hidden-section');
    document.querySelectorAll('main section:not(#landing)').forEach(section => {
        section.classList.remove('active-section');
        section.classList.add('hidden-section');
    });

    createDateFilter();
});

// ===== FILE HANDLING FUNCTIONS =====
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const validExtensions = ['csv', 'xlsx', 'xls'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        alert('Harap unggah file CSV atau Excel yang valid');
        fileUpload.value = '';
        fileInfo.style.display = 'none';
        importBtn.disabled = true;
        return;
    }
    
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <strong>File:</strong> ${file.name}<br>
        <strong>Size:</strong> ${formatFileSize(file.size)}<br>
        <strong>Type:</strong> ${file.type || 'Unknown'}
    `;
    
    importBtn.disabled = false;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

async function processUploadedFile() {
    const file = fileUpload.files[0];
    if (!file) return;

    // Show loading indicator
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'block';

    try {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === 'csv') {
            await processCSV(file);
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            await processExcel(file);
        } else {
            alert('Unsupported file format. Please upload CSV or Excel file.');
            return;
        }
        
        // Update last updated display
        const dateElement = document.getElementById('last-updated-display');
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString();
        }
        
        // Navigate to dashboard
        const dashboardLink = document.querySelector('a[href="#dashboard"]');
        if (dashboardLink) dashboardLink.click();
        
    } catch (error) {
        alert('Gagal memproses file. Cek format file dan coba lagi.');
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

function processCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function (e) {
            try {
                const csvData = e.target.result;
                
                Papa.parse(csvData, {
                    header: true,
                    dynamicTyping: true,
                    complete: function (results) {
                        if (results.errors.length > 0) {
                            console.error('CSV parsing errors:', results.errors);
                            reject('Error parsing CSV file');
                            return;
                        }
                        
                        const financialData = {
                            daily: results.data.map(row => {
                                const date = dateUtils.parseDate(row.tanggal);
                                return {
                                    tanggal: dateUtils.isValidDate(date) ? date.toISOString().split('T')[0] : 'Tanggal Invalid',
                                    pendapatan: row.pendapatan || 0,
                                    pengeluaran: row.pengeluaran || 0,
                                    laba: row.laba || 0,
                                    kategoriPendapatan: row.kategoriPendapatan || 'Other',
                                    kategoriPengeluaran: row.kategoriPengeluaran || 'Other',
                                    marketingExpenses: row.marketingExpenses || 0,
                                    employeeCosts: row.employeeCosts || 0,
                                    inventoryValue: row.inventoryValue || 0,
                                    debtPayments: row.debtPayments || 0,
                                    cashReserves: row.cashReserves || 0
                                };
                            }),
                            kategoriPengeluaran: [], // Not available in CSV
                            inventory: [], // Not available in CSV
                            employees: [], // Not available in CSV
                            debt: [] // Not available in CSV
                        };

                        // Update the dashboard with the processed data
                        updateDashboard(financialData);
                        resolve();
                    },
                    error: function (error) {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function () {
            reject('Error reading file');
        };
        
        reader.readAsText(file);
    });
}

async function processExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Pastikan nama sheet sesuai dengan template
                const sheetNames = workbook.SheetNames;
                
                // Buat objek untuk menyimpan data
                const financialData = {
                    daily: [],
                    kategoriPengeluaran: [],
                    inventory: [],
                    employees: [],
                    debt: [],
                    assets: 0,
                    cashReserve: 0,
                    monthlyExpenses: 0
                };

                // Proses setiap sheet
                sheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    
                    switch(sheetName) {
                        case 'Data Keuangan':
                            financialData.daily = jsonData.map(row => ({
                                tanggal: row.Tanggal || 'YYYY-MM-DD',
                                pendapatan: row.Pendapatan || 0,
                                pengeluaran: row.Pengeluaran || 0,
                                laba: (row.Pendapatan || 0) - (row.Pengeluaran || 0),
                                kategoriPengeluaran: row['Kategori Pengeluaran'] || 'Lainnya',
                                deskripsi: row.Deskripsi || '',
                                metodePembayaran: row['Metode Pembayaran'] || 'Tunai'
                            }));
                            break;
                            
                        case 'Kategori Pengeluaran':
                            financialData.kategoriPengeluaran = jsonData.map(row => ({
                                kategori: row.Kategori || 'Lainnya',
                                jumlah: row['Budget Bulanan'] || 0,
                                deskripsi: row.Deskripsi || ''
                            }));
                            break;
                            
                        case 'Inventaris':
                            financialData.inventory = jsonData.map(row => ({
                                kode: row['Kode Barang'] || '',
                                nama: row['Nama Barang'] || '',
                                stokAwal: row['Stok Awal'] || 0,
                                stokMasuk: row['Stok Masuk'] || 0,
                                stokKeluar: row['Stok Keluar'] || 0,
                                stokAkhir: row['Stok Akhir'] || 0,
                                hargaSatuan: row['Harga Satuan'] || 0
                            }));
                            break;
                            
                        case 'Karyawan':
                            financialData.employees = jsonData.map(row => ({
                                nik: row.NIK || '',
                                nama: row.Nama || '',
                                jabatan: row.Jabatan || '',
                                gaji: row.Gaji || 0,
                                tunjangan: row.Tunjangan || 0,
                                totalGaji: row['Total Gaji'] || 0
                            }));
                            break;
                            
                        case 'Hutang':
                            financialData.debt = jsonData.map(row => ({
                                tanggal: row.Tanggal || 'YYYY-MM-DD',
                                jenis: row['Jenis Hutang'] || '',
                                jumlah: row.Jumlah || 0,
                                jatuhTempo: row['Jatuh Tempo'] || 'YYYY-MM-DD',
                                status: row.Status || 'Belum Lunas'
                            }));
                            break;
                    }
                });

                // Hitung total hutang
                financialData.totalDebt = financialData.debt.reduce((sum, d) => sum + (d.jumlah || 0), 0);
                
                // Update dashboard dengan data yang diproses
                updateDashboard(financialData);
                console.log('Processed Financial Data:', financialData);
                resolve(financialData);
            } catch (error) {
                console.error('Error processing Excel file:', error);
                reject(error);
            }
        };
        
        reader.onerror = function (error) {
            console.error('Error reading file:', error);
            reject(error);
        };
        
        reader.readAsArrayBuffer(file);
    });
}

function processFinancialData(rawData) {
    // Ensure rawData is an array and has valid structure
    const validatedData = Array.isArray(rawData) ? rawData : [];
    
    return {
        daily: validatedData.map(item => ({
            tanggal: item?.tanggal || `Tanggal ${item?.date || ''}`, // Safe access with fallback
            pendapatan: item?.pendapatan || 0,
            pengeluaran: item?.pengeluaran || 0,
            laba: (item?.pendapatan || 0) - (item?.pengeluaran || 0)
        })),
        ketidakefisienan: sampleData.ketidakefisienan,
        improvements: sampleData.improvements,
        financialCharacter: sampleData.financialCharacter,
        kategoriPengeluaran: sampleData.kategoriPengeluaran
    };
}

function loadSampleData() {
    updateDashboard(sampleData);
    document.getElementById('last-updated-date').textContent = 'Sample data';
    document.querySelector('nav ul li a[href="#dashboard"]').click();
}

function downloadTemplate() {
    // Buat workbook baru
    const wb = XLSX.utils.book_new();

    // Sheet 1: Data Keuangan Harian
    const financialData = [
        ["Tanggal", "Pendapatan", "Pengeluaran", "Kategori Pengeluaran", "Deskripsi", "Metode Pembayaran"],
        ["2023-01-01", 1000000, 500000, "Bahan Baku", "Pembelian tepung", "Transfer Bank"],
        ["2023-01-02", 1500000, 300000, "Operasional", "Biaya listrik", "Tunai"]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(wb, ws1, "Data Keuangan");

    // Sheet 2: Kategori Pengeluaran
    const expenseCategories = [
        ["Kode", "Kategori", "Deskripsi", "Budget Bulanan"],
        ["BB", "Bahan Baku", "Bahan baku produksi", 5000000],
        ["OP", "Operasional", "Biaya operasional harian", 2000000]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(expenseCategories);
    XLSX.utils.book_append_sheet(wb, ws2, "Kategori Pengeluaran");

    // Sheet 3: Manajemen Inventaris
    const inventoryData = [
        ["Kode Barang", "Nama Barang", "Stok Awal", "Stok Masuk", "Stok Keluar", "Stok Akhir", "Harga Satuan"],
        ["BRG001", "Tepung Terigu", 100, 50, 30, 120, 10000],
        ["BRG002", "Gula Pasir", 50, 20, 10, 60, 15000]
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, ws3, "Inventaris");

    // Sheet 4: Data Karyawan
    const employeeData = [
        ["NIK", "Nama", "Jabatan", "Gaji", "Tunjangan", "Total Gaji"],
        ["001", "Budi Santoso", "Produksi", 3000000, 500000, 3500000],
        ["002", "Ani Wijaya", "Admin", 2500000, 300000, 2800000]
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(wb, ws4, "Karyawan");

    // Sheet 5: Hutang & Liabilitas
    const debtData = [
        ["Tanggal", "Jenis Hutang", "Jumlah", "Jatuh Tempo", "Status"],
        ["2023-01-01", "Pinjaman Bank", 10000000, "2023-06-01", "Belum Lunas"],
        ["2023-01-15", "Hutang Supplier", 5000000, "2023-02-01", "Lunas"]
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(debtData);
    XLSX.utils.book_append_sheet(wb, ws5, "Hutang");

    // Simpan file
    XLSX.writeFile(wb, "FinancialLens_Template.xlsx");
}

// ===== DASHBOARD UPDATE FUNCTIONS =====
function updateDashboard(data) {
    financialData = data;
    
    // Update profit & loss metrics
    updateProfitLossMetrics();
    
    // Update financial character
    updateFinancialCharacter();
    
    // Update inefficiency indicators
    updateInefficiencyIndicators();
    
    // Update improvement opportunities
    updateImprovementOpportunities();
    
    // Update charts
    updateCharts();

    // Update expense breakdown
    updateExpenseBreakdown();

    // Update financial analysis
    updateFinancialAnalysis();

    // Update KPIs
    updateKPIs();

    // Log the data for debugging
    console.log('Updated Financial Data:', financialData);
}

function updateProfitLossMetrics() {
    // Calculate totals
    const totalRevenue = financialData.daily.reduce((sum, day) => sum + day.pendapatan, 0);
    const totalExpenses = financialData.daily.reduce((sum, day) => sum + day.pengeluaran, 0);
    const totalProfit = totalRevenue - totalExpenses;
    
    // Update DOM
    document.getElementById('revenue-value').textContent = formatCurrency(totalRevenue);
    document.getElementById('expenses-value').textContent = formatCurrency(totalExpenses);
    document.getElementById('profit-value').textContent = formatCurrency(totalProfit);
    
    // Add profit/loss color indicator
    const profitElement = document.getElementById('profit-value');
    if (totalProfit > 0) {
        profitElement.style.color = 'var(--success-color)';
    } else {
        profitElement.style.color = 'var(--danger-color)';
    }
}

async function updateFinancialCharacter() {
    const personality = PersonalityAnalyzer.analyze(financialData);

    // Update UI
    document.getElementById('personality-type').textContent = personality.type;
    document.getElementById('personality-desc').textContent = personality.description;

    // Update trait meters
    const traits = personality.traits || {};
    updateTraitMeter('risk-meter', traits.riskTolerance || 0);
    updateTraitMeter('growth-meter', traits.growthFocus || 0);
    updateTraitMeter('efficiency-meter', traits.efficiency || 0);
}

function updateTraitMeter(meterId, value) {
    const meter = document.getElementById(meterId);
    if (meter) {
        meter.textContent = `${parseFloat(value.toFixed(2))}%`;
        const meterBar = meter.closest('.trait').querySelector('.trait-meter');
        if (meterBar) {
            meterBar.style.setProperty('--meter-width', `${value}%`);
        }
    }
}

function determinePersonalityType(analysis) {
    const types = {
        'Penjinak Risiko': analysis.riskTolerance < 40,
        'Pertumbuhan Seimbang': analysis.riskTolerance >= 40 && analysis.riskTolerance <= 60,
        'Pengambil Risiko': analysis.riskTolerance > 60,
        'Efisiensi Tinggi': analysis.efficiency > 70,
        'Inovator': analysis.growthFocus > 70
    };
    
    return Object.entries(types)
        .filter(([_, condition]) => condition)
        .map(([type]) => type)
        .join(' • ');
}

function generateDescription(analysis) {
    const descriptions = [];
    
    if(analysis.riskTolerance > 70) {
        descriptions.push("Anda nyaman dengan risiko tinggi untuk mencapai pertumbuhan yang cepat");
    } else if(analysis.riskTolerance < 30) {
        descriptions.push("Anda lebih memilih pendekatan konservatif dengan risiko minimal");
    }
    
    if(analysis.growthFocus > 70) {
        descriptions.push("Fokus utama pada ekspansi dan pertumbuhan bisnis");
    }
    
    if(analysis.efficiency > 70) {
        descriptions.push("Manajemen operasional yang sangat efisien");
    }
    
    return descriptions.join(". ") + ".";
}

// ===== SISTEM AI =====
const AI = {
    // Analisis ketidakefisienan
    analisisTitikMasalah: (data) => {
        const insights = [];
        
        // 1. Analyze expense categories
        const totalExpenses = data.kategoriPengeluaran.reduce((sum, cat) => sum + cat.jumlah, 0);
        
        data.kategoriPengeluaran.forEach(cat => {
            const percentage = (cat.jumlah / totalExpenses) * 100;
            
            // Flag categories exceeding 20% of total expenses
            if (percentage > 20) {
                insights.push({
                    jenis: 'Kategori Besar',
                    nama: cat.kategori,
                    nilai: `${percentage.toFixed(1)}%`,
                    deskripsi: `Pengeluaran ${cat.kategori} melebihi 20% dari total pengeluaran`
                });
            }
        });

        // 2. Analyze profit anomalies
        const dailyProfits = data.daily.map(d => d.pendapatan - d.pengeluaran);
        const avgProfit = dailyProfits.reduce((sum, p) => sum + p, 0) / dailyProfits.length;
        
        dailyProfits.forEach((profit, index) => {
            if (profit < avgProfit * 0.5) { // Flag days with profit < 50% of average
                        insights.push({
                            jenis: 'Anomali Laba',
                    nama: `Tanggal ${data.daily[index].tanggal}`,
                    nilai: formatCurrency(profit),
                    deskripsi: `Laba lebih rendah dari rata-rata (${formatCurrency(avgProfit)})`
                });
            }
        });

        return insights;
    },

    // Analisis peluang peningkatan
    analisisPeluangPeningkatan: (data) => {
        const rekomendasi = [];
        
        // Validasi data
        const totalLaba = data.daily.reduce((sum, d) => sum + (d.pendapatan - d.pengeluaran), 0);
        const totalPengeluaran = data.daily.reduce((sum, d) => sum + d.pengeluaran, 0);
        
        // 1. Analisis penghematan biaya dengan validasi
        data.kategoriPengeluaran.forEach(cat => {
            const potensiPenghematan = cat.jumlah * 0.05; // 5% pengurangan
            const labaSaatIni = Math.max(totalLaba, 1);  // Hindari pembagian dengan nol
            
            // Hitung dampak sebenarnya
            const dampakLaba = totalLaba > 0 ? 
                (potensiPenghematan / labaSaatIni) * 100 :
                potensiPenghematan;  // Jika laba negatif, tampilkan nilai absolut
                
            const persenPengeluaran = (cat.jumlah / Math.max(totalPengeluaran, 1)) * 100;
            
            if(persenPengeluaran > 5) {  // Threshold lebih rendah
                rekomendasi.push({
                    aksi: 'Optimasi Biaya',
                    target: cat.kategori,
                    deskripsi: totalLaba > 0 ?
                        `Penghematan ${formatCurrency(potensiPenghematan)} (${dampakLaba.toFixed(1)}% laba)` :
                        `Pengurangan kerugian ${formatCurrency(potensiPenghematan)}`
                });
            }
        });

        // 2. Analisis peningkatan pendapatan
        const pertumbuhanRataRata = data.daily.slice(-3).reduce((sum, d) => {
            return sum + ((d.pendapatan - d.pengeluaran) / d.pendapatan * 100);
        }, 0) / 3;

        if(pertumbuhanRataRata < 10) {
            const potensiPeningkatan = totalLaba * 0.15; // 15% dari laba saat ini
            rekomendasi.push({
                aksi: 'Tingkatkan Penjualan',
                target: 'Strategi Pemasaran',
                deskripsi: `Peningkatan 15% penjualan bisa menambah laba sebesar ${formatCurrency(potensiPeningkatan)}`
            });
        }

        // 3. Analisis efisiensi operasional
        const rasioOperasional = (data.daily.reduce((sum, d) => sum + d.pengeluaran, 0) /
                                data.daily.reduce((sum, d) => sum + d.pendapatan, 1)) * 100;
        
        if(rasioOperasional > 70) {
            rekomendasi.push({
                aksi: 'Efisiensi Operasional',
                target: 'Proses Bisnis',
                deskripsi: `Rasio operasional ${rasioOperasional.toFixed(1)}% - ideal <70%`
            });
        }

        // Fallback: Jika tidak ada rekomendasi, berikan yang terbaik
        if(rekomendasi.length === 0) {
            const bestCategory = data.kategoriPengeluaran.reduce((max, cat) => 
                cat.jumlah > max.jumlah ? cat : max, 
                {jumlah: 0, kategori: ''}
            );
            
            const potensi = bestCategory.jumlah * 0.05; // 5% pengurangan
            const dampak = (potensi / Math.max(totalLaba, 1)) * 100;
            
            rekomendasi.push({
                aksi: 'Optimasi Terbaik',
                target: bestCategory.kategori,
                deskripsi: `Rekomendasi terbaik: Pengurangan ${bestCategory.kategori} 5% (${dampak.toFixed(1)}% peningkatan laba)`
            });
        }

        // Format persentase lebih akurat
        return rekomendasi.map(rec => {
            if(rec.deskripsi.includes('%')) {
                const value = parseFloat(rec.deskripsi.split('%')[0].split('(')[1]);
                rec.deskripsi = rec.deskripsi.replace(/(\d+\.\d+)%/, m => {
                    const num = parseFloat(m);
                    return num < 0.1 ? '<0.1%' : num.toFixed(1) + '%';
                });
            }
            return rec;
        });
    }
};

// ===== UPDATE FUNGSI YANG ADA =====
function updateInefficiencyIndicators() {
    const inefficiencyList = document.getElementById('inefficiency-list');
    if (!inefficiencyList) return;

    // Show loading state
    inefficiencyList.innerHTML = '<div class="p-2 text-center text-gray-500">🔍 Mencari masalah...</div>';

    // Validate financial data
    if (!financialData || !financialData.kategoriPengeluaran || !Array.isArray(financialData.kategoriPengeluaran)) {
        inefficiencyList.innerHTML = '<div class="no-issues">🎉 Tidak ada masalah terdeteksi</div>';
        return;
    }

    // Analyze inefficiencies
    const insights = AI.analisisTitikMasalah(financialData);
    
    // Update UI based on analysis
    if (insights.length > 0) {
        inefficiencyList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-header">
                    <span class="insight-icon">⚠️</span>
                    <span class="insight-title">${insight.nama}</span>
                    <span class="insight-value">${insight.nilai}</span>
                </div>
                <div class="insight-description">${insight.deskripsi}</div>
            </div>
        `).join('');
    } else {
        inefficiencyList.innerHTML = '<div class="no-issues">🎉 Tidak ada masalah terdeteksi</div>';
    }
}

function updateImprovementOpportunities() {
    const improvementList = document.getElementById('improvement-list');
    if(!improvementList) return;
    
    const recommendations = AI.analisisPeluangPeningkatan(financialData);
    
    improvementList.innerHTML = recommendations.length > 0
        ? recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="rec-icon">🚀</div>
                <div class="rec-content">
                    <div class="rec-action">${rec.aksi}</div>
                    <div class="rec-target">${rec.target}</div>
                    <div class="rec-desc">${rec.deskripsi}</div>
                </div>
            </div>
        `).join('')
        : '<div class="no-rec">💡 Tidak ada rekomendasi saat ini</div>';
}

function updateCharts() {
    // Hapus chart sebelumnya
    if (charts.ceritaUang) charts.ceritaUang.destroy();

    const ctx = document.getElementById('cerita-uang-chart').getContext('2d');
    
    const labels = (financialData?.daily || []).map(d => 
        dateUtils.formatDate(d?.tanggal) || `Tanggal ${index + 1}`
    );
    
    charts.ceritaUang = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: (financialData.daily || []).map(d => d?.pendapatan || 0),
                    borderColor: '#78E08F', // Hijau
                    backgroundColor: 'rgba(120, 224, 143, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5
                },
                {
                    label: 'Pengeluaran',
                    data: (financialData.daily || []).map(d => d?.pengeluaran || 0),
                    borderColor: '#FF7979', // Merah
                    backgroundColor: 'rgba(255, 121, 121, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5
                },
                {
                    label: 'Laba',
                    data: (financialData.daily || []).map(d => d?.laba || 0),
                    borderColor: '#63B3ED', // Biru
                    backgroundColor: 'rgba(99, 179, 237, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#4a5568',
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: '#2d3748',
                    titleColor: '#f7fafc',
                    bodyColor: '#f7fafc',
                    borderColor: '#4a5568',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        title: (tooltipItems) => `Tanggal ${tooltipItems[0].label}`,
                        label: function(context) {
                            return ` ${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#718096',
                        maxRotation: 0
                    }
                },
                y: {
                    grid: {
                        color: '#e2e8f0',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        callback: (value) => {
                            if (value >= 1000000) return `${value/1000000}JT`;
                            return `${value/1000}RB`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    cubicInterpolation: 'monotone'
                }
            },
            animation: {
                duration: 300,
                easing: 'easeOutQuart'
            },
            responsiveAnimationDuration: 300
        }
    });
}

function updateExpenseBreakdown() {
    const expenseCanvas = document.getElementById('expense-breakdown-chart');
    if (!expenseCanvas) return;
    
    const expenseCtx = expenseCanvas.getContext('2d');
    const expenseCategories = financialData.kategoriPengeluaran || []; // Ensure this is populated from your data

    const labels = expenseCategories.map(category => category.kategori);
    const data = expenseCategories.map(category => category.jumlah);

    charts.expenseBreakdown = new Chart(expenseCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(26, 115, 232, 0.5)',
                    'rgba(234, 67, 53, 0.5)',
                    'rgba(52, 168, 83, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateFinancialAnalysis() {
    const totalRevenue = financialData.daily.reduce((sum, day) => sum + day.pendapatan, 0);
    const totalExpenses = financialData.daily.reduce((sum, day) => sum + day.pengeluaran, 0);
    const totalProfit = totalRevenue - totalExpenses;

    // Safe element updates
    const safeUpdate = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Profit Margin
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    safeUpdate('profit-margin-value', `${profitMargin.toFixed(1)}%`);

    // Expense Ratio
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    safeUpdate('expense-ratio-value', `${expenseRatio.toFixed(1)}%`);

    // Year-over-Year Growth
    const yoyGrowth = calculateYearOverYearGrowth(financialData);
    safeUpdate('year-over-year-growth-value', `${yoyGrowth.toFixed(1)}%`);

    // === NEW: Localized Metrics ===
    // Liquidity Ratio (Rasio Likuiditas)
    const currentAssets = totalRevenue * 0.3; // Example: 30% of revenue as current assets
    const currentLiabilities = totalExpenses * 0.2; // Example: 20% of expenses as current liabilities
    const liquidityRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A';
    safeUpdate('liquidity-ratio-value', liquidityRatio);

    // Debt Ratio (Rasio Utang)
    const totalDebt = 0; // Example: Assume no debt for now
    const debtRatio = totalRevenue > 0 ? ((totalDebt / totalRevenue) * 100).toFixed(1) : 'N/A';
    safeUpdate('debt-ratio-value', `${debtRatio}%`);

    // Industry Benchmarks (Example: Retail)
    const industryBenchmarks = {
        profitMargin: 10.5, // Example: Retail industry average
        expenseRatio: 65.0,
        liquidityRatio: 1.5
    };
    safeUpdate('industry-profit-margin', `${industryBenchmarks.profitMargin}%`);
    safeUpdate('industry-expense-ratio', `${industryBenchmarks.expenseRatio}%`);
    safeUpdate('industry-liquidity-ratio', industryBenchmarks.liquidityRatio);

    // === NEW: Loan Eligibility Checker ===
    const loanEligibility = {
        minProfitMargin: 10, // Minimum profit margin for eligibility
        maxDebtRatio: 50, // Maximum debt ratio for eligibility
        minLiquidityRatio: 1.2 // Minimum liquidity ratio for eligibility
    };

    const isEligible = profitMargin >= loanEligibility.minProfitMargin &&
                      debtRatio <= loanEligibility.maxDebtRatio &&
                      liquidityRatio >= loanEligibility.minLiquidityRatio;

    safeUpdate('loan-eligibility-value', isEligible ? 'Eligible ✅' : 'Not Eligible ❌');
}

// Example function to calculate Year-over-Year Growth
function calculateYearOverYearGrowth(data) {
    if (data.daily.length < 12) return 0; // Not enough data for YoY growth

    const lastYearRevenue = data.daily.slice(0, 6).reduce((sum, day) => sum + day.pendapatan, 0); // First 6 days
    const currentYearRevenue = data.daily.slice(6).reduce((sum, day) => sum + day.pendapatan, 0); // Last 6 days

    return lastYearRevenue > 0 ? ((currentYearRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;
}

function updateKPIs() {
    // Safe update helper
    const safeUpdate = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // Simplified KPI display
    safeUpdate('kpi-1-value', '⭐️ Good');  // ROI
    safeUpdate('kpi-2-value', '🛡️ Safe');  // Current Ratio
    safeUpdate('kpi-3-value', '🏋️ Okay');  // Debt-to-Equity
}

function calculateCashFlow() {
    const financialData = getFinancialData(); // Ensure this function returns the correct data
    if (!financialData) {
        console.error('Financial data is not available.');
        return;
    }

    // Calculate cash flow forecast
    const forecastData = {
        labels: ['Bulan 1', 'Bulan 2', 'Bulan 3', 'Bulan 4', 'Bulan 5', 'Bulan 6'],
        values: [1000000, 1200000, 1100000, 1300000, 1400000, 1500000] // Example data
    };

    // Update the chart
    updateCashFlowForecastChart(forecastData);
}

function updateCashFlowForecastChart(data) {
    const ctx = document.getElementById('cash-flow-forecast-chart')?.getContext('2d');
    
    if (!ctx) {
        console.error('Chart canvas not found. Ensure the element with ID "cash-flow-forecast-chart" exists in the DOM.');
        return;
    }

    // Destroy existing chart instance if it exists
    if (window.cashFlowChart) {
        window.cashFlowChart.destroy();
    }

    // Create new chart
    window.cashFlowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Proyeksi Kas',
                data: data.values,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Proyeksi Kas 6 Bulan ke Depan'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah (Rp)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Bulan'
                    }
                }
            }
        }
    });
}

function sanitizeInput(input) {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function submitFeedback() {
    const feedback = sanitizeInput(document.getElementById('user-feedback').value);
    if (feedback) {
        // Here you can implement logic to send feedback to a server or store it locally
        console.log('Feedback submitted:', feedback);
        document.getElementById('feedback-status').textContent = 'Terima kasih atas masukan Anda!';
        document.getElementById('user-feedback').value = ''; // Clear the textarea
    } else {
        document.getElementById('feedback-status').textContent = 'Harap masukkan umpan balik sebelum mengirim.';
    }
}

// Add this function definition before the event listeners
function handleNavClick(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    
    // Update active nav link
    document.querySelectorAll('nav ul li a').forEach(link => {
        link.classList.remove('active');
    });
    this.classList.add('active');
    
    // Show/hide sections
    document.querySelectorAll('main section').forEach(section => {
        if (section.id === targetId) {
            section.classList.add('active-section');
            section.classList.remove('hidden-section');
        } else {
            section.classList.remove('active-section');
            section.classList.add('hidden-section');
        }
    });
}

// ===== MODEL AI KEPRIBADIAN =====
const PersonalityAnalyzer = {
    analyze: function(financialData) {
        try {
            const metrics = this.preprocessData(financialData);
            return this.calculatePersonality(metrics);
        } catch (error) {
            console.error('Analisis Gagal:', error.message);
        return {
                type: 'Tidak Diketahui',
                description: 'Data tidak cukup untuk menganalisis kepribadian finansial.',
                traits: {
                    riskTolerance: 0,
                    growthFocus: 0,
                    efficiency: 0
                }
            };
        }
    },
    
    preprocessData: function(financialData) {
        const days = financialData?.daily || [];
        const expenses = financialData?.kategoriPengeluaran || [];
        
        // Simplified metrics
        return {
            totalRevenue: days.reduce((sum, d) => sum + (d.pendapatan || 0), 0),
            totalExpenses: days.reduce((sum, d) => sum + (d.pengeluaran || 0), 0),
            totalProfit: days.reduce((sum, d) => sum + (d.laba || 0), 0),
            expenseCategories: expenses.length
        };
    },

    calculatePersonality: function(metrics) {
        // Simplified calculations with 2 decimal places
        const riskTolerance = Math.min(100, parseFloat(((metrics.totalProfit / metrics.totalRevenue) * 100 || 0).toFixed(2)));
        const growthFocus = Math.min(100, parseFloat(((metrics.totalRevenue / metrics.totalExpenses) * 10 || 0).toFixed(2)));
        const efficiency = Math.min(100, parseFloat(((1 - (metrics.totalExpenses / metrics.totalRevenue)) * 100 || 0).toFixed(2)));
            
            return {
            type: determinePersonalityType({ riskTolerance, growthFocus, efficiency }),
            description: generateDescription({ riskTolerance, growthFocus, efficiency }),
            traits: {
                riskTolerance,
                growthFocus,
                efficiency
            }
        };
    }
};

// ===== HELPER FUNCTIONS =====
function determinePersonalityType(analysis) {
    const types = {
        'Penjinak Risiko': analysis.riskTolerance < 40,
        'Pertumbuhan Seimbang': analysis.riskTolerance >= 40 && analysis.riskTolerance <= 60,
        'Pengambil Risiko': analysis.riskTolerance > 60,
        'Efisiensi Tinggi': analysis.efficiency > 70,
        'Inovator': analysis.growthFocus > 70
    };

    return Object.entries(types)
        .filter(([_, condition]) => condition)
        .map(([type]) => type)
        .join(' • ');
}

function generateDescription(analysis) {
    const descriptions = [];

    if (analysis.riskTolerance > 70) {
        descriptions.push("Anda nyaman dengan risiko tinggi untuk mencapai pertumbuhan yang cepat");
    } else if (analysis.riskTolerance < 30) {
        descriptions.push("Anda lebih memilih pendekatan konservatif dengan risiko minimal");
    }

    if (analysis.growthFocus > 70) {
        descriptions.push("Fokus utama pada ekspansi dan pertumbuhan bisnis");
    }

    if (analysis.efficiency > 70) {
        descriptions.push("Manajemen operasional yang sangat efisien");
    }

    return descriptions.join(". ") + ".";
}

// Add date filter component
function createDateFilter() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'date-filter mb-4';
    
    filterContainer.innerHTML = `
        <div class="flex gap-4 items-center">
            <div class="flex-1">
                <label for="start-date" class="block text-sm font-medium mb-1">Dari Tanggal</label>
                <input type="date" id="start-date" class="w-full p-2 border rounded">
            </div>
            <div class="flex-1">
                <label for="end-date" class="block text-sm font-medium mb-1">Sampai Tanggal</label>
                <input type="date" id="end-date" class="w-full p-2 border rounded">
            </div>
            <div class="self-end">
                <button id="apply-filter" class="btn primary">Terapkan Filter</button>
            </div>
        </div>
    `;
    
    document.querySelector('.dashboard-header').appendChild(filterContainer);
    
    // Add event listener for filter
    document.getElementById('apply-filter').addEventListener('click', applyDateFilter);
}

// Add filter function
function applyDateFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('Harap pilih rentang tanggal yang valid');
        return;
    }
    
    const filteredData = financialData.daily.filter(entry => {
        const entryDate = new Date(entry.tanggal);
        return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
    
    updateDashboard({
        ...financialData,
        daily: filteredData
    });
}

// Tambahkan fungsi setBudget yang hilang
function setBudget(data) {
    const budgetElements = document.querySelectorAll('.budget-value');
    budgetElements.forEach(el => {
        const category = el.dataset.category;
        const budget = data.kategoriPengeluaran.find(k => k.kategori === category)?.budget || 0;
        el.textContent = formatCurrency(budget);
    });
}

// Perbaiki fungsi handleFileUpload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const data = await readExcelFile(file);
        if (!data || !data.DataKeuangan || data.DataKeuangan.length === 0) {
            throw new Error('File tidak berisi data yang valid');
        }

        // Proses data
        const processedData = processFinancialData(data);
        
        // Update dashboard
        updateDashboard(processedData);
        setBudget(processedData); // Panggil fungsi setBudget
        updateCharts(processedData);
        
        console.log('Updated Financial Data:', processedData);
    } catch (error) {
        console.error('Error processing file:', error);
        showError('Gagal memproses file. Pastikan format file sesuai template.');
    }
}

// Perbaiki fungsi readExcelFile
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Pastikan nama sheet sesuai
            const result = {
                DataKeuangan: XLSX.utils.sheet_to_json(workbook.Sheets['Data Keuangan']),
                KategoriPengeluaran: XLSX.utils.sheet_to_json(workbook.Sheets['Kategori Pengeluaran']),
                Inventaris: XLSX.utils.sheet_to_json(workbook.Sheets['Inventaris']),
                Karyawan: XLSX.utils.sheet_to_json(workbook.Sheets['Karyawan']),
                Hutang: XLSX.utils.sheet_to_json(workbook.Sheets['Hutang'])
            };
            
            console.log('Raw Excel Data:', data);
            resolve(result);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}