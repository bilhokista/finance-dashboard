// ===== GLOBAL VARIABLES =====
let financialData = null;
let charts = {};

// Sample data for testing
const sampleData = {
    monthly: [
        { bulan: 'Jan', pendapatan: 45000, pengeluaran: 38000, laba: 7000 },
        { bulan: 'Feb', pendapatan: 48000, pengeluaran: 39500, laba: 8500 },
        { bulan: 'Mar', pendapatan: 52000, pengeluaran: 41000, laba: 11000 },
        { bulan: 'Apr', pendapatan: 49000, pengeluaran: 40000, laba: 9000 },
        { bulan: 'May', pendapatan: 53000, pengeluaran: 42500, laba: 10500 },
        { bulan: 'Jun', pendapatan: 55000, pengeluaran: 43000, laba: 12000 }
    ],
    kategoriPengeluaran: [
        { kategori: 'Sewa', jumlah: 12000 },
        { kategori: 'Gaji', jumlah: 18000 },
        { kategori: 'Pemasaran', jumlah: 5000 },
        { kategori: 'Utilitas', jumlah: 2500 },
        { kategori: 'Suplai', jumlah: 3500 },
        { kategori: 'Lainnya', jumlah: 2000 }
    ],
    ketidakefisienan: [
        { nama: 'Biaya Marketing Tinggi', nilai: '10.5%', tingkat: 'sedang', deskripsi: 'Biaya marketing di atas rata-rata industri' },
        { nama: 'Penghasilan Per Karyawan Rendah', nilai: '$8,700', tingkat: 'tinggi', deskripsi: 'Di bawah standar industri $12,000 per karyawan' },
        { nama: 'Biaya Variabel Tinggi', nilai: '35%', tingkat: 'rendah', deskripsi: 'Sedikit di atas rentang optimal (30-33%)' }
    ],
    improvements: [
        { title: 'Mengurangi Biaya Pemasaran', deskripsi: 'Pertimbangkan mengalokasikan anggaran ke saluran yang lebih efektif', tindakan: 'Tinjau ROI saluran pemasaran' },
        { title: 'Meningkatkan Produktivitas Karyawan', deskripsi: 'Penghasilan per karyawan di bawah rata-rata industri', tindakan: 'Tinjau proses kerja dan pelatihan' },
        { title: 'Mengoptimalkan Manajemen Inventaris', deskripsi: 'Inventaris saat ini di bawah tingkat optimal', tindakan: 'Menerapkan sistem inventaris just-in-time' }
    ],
    financialCharacter: {
        type: 'Balanced Growth',
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

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Safely initialize elements
    const initListener = (selector, event, handler) => {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(event, handler);
    };

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
        
        reader.onload = function(e) {
            try {
                const csvData = e.target.result;
                
                // Use PapaParse to parse CSV
                Papa.parse(csvData, {
                    header: true,
                    dynamicTyping: true,
                    complete: function(results) {
                        if (results.errors.length > 0) {
                            console.error('CSV parsing errors:', results.errors);
                            reject('Error parsing CSV file');
                            return;
                        }
                        
                        // Process the parsed data
                        const processedData = processFinancialData(results.data);
                        updateDashboard(processedData);
                        resolve();
                    },
                    error: function(error) {
                        reject(error);
                    }
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject('Error reading file');
        };
        
        reader.readAsText(file);
    });
}

async function processExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Use header: 1 to get an array of arrays
                
                // Convert the array of arrays to an array of objects
                const headers = jsonData[0]; // First row as headers
                const dataRows = jsonData.slice(1); // Remaining rows as data

                const processedData = dataRows.map(row => {
                    return {
                        bulan: row[0], // Assuming the first column is month
                        pendapatan: row[1], // Assuming the second column is revenue
                        pengeluaran: row[2] // Assuming the third column is expenses
                    };
                });

                // Process the data into the expected format
                const finalData = processFinancialData(processedData);
                updateDashboard(finalData);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject('Error reading file');
        };
        
        reader.readAsArrayBuffer(file);
    });
}

function processFinancialData(rawData) {
    // Pastikan rawData adalah array
    const validatedData = Array.isArray(rawData) ? rawData : [];
    
    return {
        monthly: validatedData.map(item => ({
            bulan: item.bulan || `Bulan ${item.month || ''}`, // Fallback untuk bulan
            pendapatan: item.pendapatan || 0,
            pengeluaran: item.pengeluaran || 0,
            laba: (item.pendapatan || 0) - (item.pengeluaran || 0)
        })),
        ketidakefisienan: sampleData.ketidakefisienan, // You can modify this to calculate based on real data
        improvements: sampleData.improvements, // You can modify this to calculate based on real data
        financialCharacter: sampleData.financialCharacter, // You can modify this to calculate based on real data
        kategoriPengeluaran: sampleData.kategoriPengeluaran
    };
}

function loadSampleData() {
    updateDashboard(sampleData);
    document.getElementById('last-updated-date').textContent = 'Sample data';
    document.querySelector('nav ul li a[href="#dashboard"]').click();
}

function downloadTemplate() {
    // Create a simple template Excel file
    const worksheet = XLSX.utils.json_to_sheet([
        {
            bulan: 'Jan',
            pendapatan: 50000,
            pengeluaran: 40000,
            sewa: 5000,
            gaji: 20000,
            pemasaran: 8000,
            utilitas: 2000,
            suplai: 3000,
            lainnya: 2000
        }
    ]);
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Data');
    
    // Generate file and trigger download
    XLSX.writeFile(workbook, 'financial_data_template.xlsx');
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

    // Update Oopsie Spots
    updateOopsieSpots();
}

function updateProfitLossMetrics() {
    // Calculate totals
    const totalRevenue = financialData.monthly.reduce((sum, month) => sum + month.pendapatan, 0);
    const totalExpenses = financialData.monthly.reduce((sum, month) => sum + month.pengeluaran, 0);
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
    try {
        if(!financialData || !financialData.monthly || financialData.monthly.length === 0) {
            throw new Error('Data bulanan tidak tersedia');
        }
        
        const analysis = await PersonalityAnalyzer.analyze(financialData);
        
        const character = {
            type: determinePersonalityType(analysis),
            description: generateDescription(analysis),
            traits: analysis
        };
        
        // Update UI dengan safeUpdate
        safeUpdate('risk-meter', `${analysis.riskTolerance.toFixed(1)}%`);
        safeUpdate('growth-meter', `${analysis.growthFocus.toFixed(1)}%`);
        safeUpdate('efficiency-meter', `${analysis.efficiency.toFixed(1)}%`);
        safeUpdate('personality-type', character.type);
        safeUpdate('personality-desc', character.description);
        
    } catch (error) {
        console.error('Error analisis kepribadian:', error);
        safeUpdate('personality-type', 'Analisis Gagal');
        safeUpdate('personality-desc', 'Data tidak cukup untuk menganalisis kepribadian finansial');
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
        
        // 1. Analisis kategori pengeluaran
        const totalPengeluaran = data.kategoriPengeluaran.reduce((sum, cat) => sum + cat.jumlah, 0);
        data.kategoriPengeluaran.forEach(cat => {
            const persentase = (cat.jumlah / totalPengeluaran) * 100;
            if(persentase > 30) { // Threshold 30%
                insights.push({
                    jenis: 'Kategori Besar',
                    nama: `${cat.kategori}`,
                    nilai: `${persentase.toFixed(1)}%`,
                    deskripsi: `Pengeluaran ${cat.kategori} melebihi 30% dari total pengeluaran`
                });
            }
        });

        // 2. Analisis tren laba
        const trenLaba = tf.tensor(data.monthly.map(m => m.pendapatan - m.pengeluaran));
        const model = tf.sequential({
            layers: [tf.layers.dense({units: 1, inputShape: [1]})]
        });
        
        model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
        const xs = tf.tensor1d(Array.from({length: data.monthly.length}, (_, i) => i));
        const ys = trenLaba;
        
        model.fit(xs, ys, {epochs: 50}).then(() => {
            const prediksi = model.predict(xs);
            const residuals = ys.sub(prediksi).abs();
            const threshold = residuals.mean().dataSync()[0];
            
            residuals.data().then(values => {
                values.forEach((val, idx) => {
                    if(val > threshold * 1.5) {
                        insights.push({
                            jenis: 'Anomali Laba',
                            nama: `Bulan ${data.monthly[idx].bulan}`,
                            nilai: `${val.toFixed(0)}`,
                            deskripsi: `Laba tidak sesuai tren (deviasi tinggi)`
                        });
                    }
                });
            });
        });

        return insights;
    },

    // Analisis peluang peningkatan
    analisisPeluangPeningkatan: (data) => {
        const rekomendasi = [];
        
        // Validasi data
        const totalLaba = data.monthly.reduce((sum, m) => sum + (m.pendapatan - m.pengeluaran), 0);
        const totalPengeluaran = data.monthly.reduce((sum, m) => sum + m.pengeluaran, 0);
        
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
        const pertumbuhanRataRata = data.monthly.slice(-3).reduce((sum, m) => {
            return sum + ((m.pendapatan - m.pengeluaran) / m.pendapatan * 100);
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
        const rasioOperasional = (data.monthly.reduce((sum, m) => sum + m.pengeluaran, 0) /
                                data.monthly.reduce((sum, m) => sum + m.pendapatan, 1)) * 100;
        
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
    if(!inefficiencyList) return;
    
    const insights = AI.analisisTitikMasalah(financialData);
    
    inefficiencyList.innerHTML = insights.length > 0 
        ? insights.map(insight => `
            <div class="insight-item">
                <div class="insight-header">
                    <span class="insight-icon">⚠️</span>
                    <span class="insight-title">${insight.nama}</span>
                    <span class="insight-value">${insight.nilai}</span>
                </div>
                <div class="insight-description">${insight.deskripsi}</div>
            </div>
        `).join('')
        : '<div class="no-issues">🎉 Tidak ada masalah terdeteksi</div>';
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
    
    const labels = (financialData?.monthly || []).map((m, index) => 
        m?.bulan || `Bulan ${index + 1}`
    );
    
    charts.ceritaUang = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: (financialData.monthly || []).map(m => m?.pendapatan || 0),
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
                    data: (financialData.monthly || []).map(m => m?.pengeluaran || 0),
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
                    data: (financialData.monthly || []).map(m => m?.laba || 0),
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
                        title: (tooltipItems) => `Bulan ${tooltipItems[0].label}`,
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
            }
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
    const totalRevenue = financialData.monthly.reduce((sum, month) => sum + month.pendapatan, 0);
    const totalExpenses = financialData.monthly.reduce((sum, month) => sum + month.pengeluaran, 0);
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
}

// Example function to calculate Year-over-Year Growth
function calculateYearOverYearGrowth(data) {
    if (data.monthly.length < 12) return 0; // Not enough data for YoY growth

    const lastYearRevenue = data.monthly.slice(0, 6).reduce((sum, month) => sum + month.pendapatan, 0); // First 6 months
    const currentYearRevenue = data.monthly.slice(6).reduce((sum, month) => sum + month.pendapatan, 0); // Last 6 months

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

let budget = {
    pendapatan: 0,
    pengeluaran: 0
};

function setBudget() {
    const revenueBudget = parseFloat(document.getElementById('budget-revenue').value) || 0;
    const expensesBudget = parseFloat(document.getElementById('budget-expenses').value) || 0;

    budget.pendapatan = revenueBudget;
    budget.pengeluaran = expensesBudget;

    updateBudgetStatus();
}

function updateBudgetStatus() {
    const totalRevenue = financialData.monthly.reduce((sum, month) => sum + month.pendapatan, 0);
    const totalExpenses = financialData.monthly.reduce((sum, month) => sum + month.pengeluaran, 0);

    const revenueStatus = totalRevenue >= budget.pendapatan ? 'On Track' : 'Under Budget';
    const expensesStatus = totalExpenses <= budget.pengeluaran ? 'On Track' : 'Over Budget';

    document.getElementById('budget-status-value').textContent = `Pendapatan: ${revenueStatus}, Pengeluaran: ${expensesStatus}`;
}

function analyzeScenario() {
    const projectedRevenue = parseFloat(document.getElementById('scenario-revenue').value) || 0;
    const projectedExpenses = parseFloat(document.getElementById('scenario-expenses').value) || 0;

    const projectedProfit = projectedRevenue - projectedExpenses;
    const profitMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

    document.getElementById('scenario-results').innerHTML = `
        <p>Projected Profit: ${formatCurrency(projectedProfit)}</p>
        <p>Projected Profit Margin: ${profitMargin.toFixed(2)}%</p>
    `;
}

function calculateCashFlow() {
    const totalRevenue = financialData.monthly.reduce((sum, month) => sum + month.pendapatan, 0);
    const totalExpenses = financialData.monthly.reduce((sum, month) => sum + month.pengeluaran, 0);
    const projectedCashFlow = totalRevenue - totalExpenses;

    document.getElementById('projected-cash-flow').textContent = formatCurrency(projectedCashFlow);
}

function submitFeedback() {
    const feedback = document.getElementById('user-feedback').value;
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
    model: null,
    
    init: async function() {
        // Arsitektur model
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({units: 16, activation: 'relu', inputShape: [8]}),
                tf.layers.dense({units: 8, activation: 'relu'}),
                tf.layers.dense({units: 3, activation: 'sigmoid'}) // Output: [risk, growth, efficiency]
            ]
        });
        
        // Compile model
        this.model.compile({
            optimizer: 'adam',
            loss: 'meanSquaredError'
        });
        
        // Latih dengan data sintetis
        await this.trainSyntheticData();
    },
    
    trainSyntheticData: async function() {
        // Generate 1000 sampel data sintetis
        const features = [];
        const labels = [];
        
        for(let i = 0; i < 1000; i++) {
            const data = this.generateSyntheticData();
            features.push(data.features);
            labels.push(data.label);
        }
        
        // Konversi ke tensor
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels);
        
        // Training
        await this.model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32
        });
    },
    
    generateSyntheticData: function() {
        // Karakteristik acak
        const revenueVolatility = Math.random();
        const expenseStability = Math.random();
        const profitMargin = Math.random();
        const reinvestmentRatio = Math.random();
        const debtRatio = Math.random();
        const emergencyFund = Math.random();
        const growthRate = Math.random();
        const expenseCategories = Math.random();
        
        // Hitung label (ground truth)
        const riskTolerance = 0.6 * revenueVolatility + 0.4 * debtRatio;
        const growthFocus = 0.5 * growthRate + 0.3 * reinvestmentRatio + 0.2 * expenseCategories;
        const efficiency = 0.4 * profitMargin + 0.3 * (1 - expenseStability) + 0.3 * emergencyFund;
        
        return {
            features: [
                revenueVolatility,
                expenseStability,
                profitMargin,
                reinvestmentRatio,
                debtRatio,
                emergencyFund,
                growthRate,
                expenseCategories
            ],
            label: [
                riskTolerance,
                growthFocus,
                efficiency
            ]
        };
    },
    
    preprocessData: function(financialData) {
        const months = financialData?.monthly || [];
        const expenses = financialData?.expenseCategories || [];
        
        return {
            revenueVolatility: this.calculateVolatility(months.map(m => m.pendapatan || 0)),
            expenseStability: this.calculateStability(months.map(m => m.pengeluaran || 0)),
            profitMargin: months.length > 0 ? 
                months.reduce((sum, m) => sum + (m.pendapatan - m.pengeluaran), 0) / 
                Math.max(months.reduce((sum, m) => sum + m.pendapatan, 0), 0.01) : 0,
            reinvestmentRatio: expenses.find(c => c.category === 'Reinvestasi')?.amount || 0,
            debtRatio: (financialData.debt || 0) / Math.max(financialData.assets || 1, 1),
            emergencyFund: (financialData.cashReserve || 0) / Math.max(financialData.monthlyExpenses || 1, 1),
            growthRate: this.calculateGrowthRate(months.map(m => m.pendapatan)),
            expenseCategories: expenses.length / 10
        };
    },
    
    calculateVolatility: function(values) {
        if(!values || values.length < 2) return 0;
        const mean = values.reduce((a,b) => a + b, 0) / values.length;
        const variance = values.map(x => Math.pow(x - mean, 2)).reduce((a,b) => a + b, 0) / values.length;
        return Math.sqrt(variance) / (mean || 1);
    },
    
    calculateStability: function(values) {
        if(!values || values.length < 2) return 1;
        const changes = [];
        for(let i = 1; i < values.length; i++) {
            const prev = values[i-1] || 1;
            changes.push(Math.abs(values[i] - prev) / prev);
        }
        const avgChange = changes.reduce((a,b) => a + b, 0) / changes.length;
        return 1 - avgChange;
    },
    
    calculateGrowthRate: function(values) {
        if(!values || values.length === 0) return 0;
        const first = values[0] || 1;
        const last = values[values.length-1] || first;
        return (last - first) / first;
    },
    
    analyze: async function(financialData) {
        try {
            const input = this.preprocessData(financialData || {});
            const inputTensor = tf.tensor2d([Object.values(input)]);
            const prediction = await this.model.predict(inputTensor).data();
            
            return {
                riskTolerance: Math.min(Math.max(prediction[0] * 100, 0), 100),
                growthFocus: Math.min(Math.max(prediction[1] * 100, 0), 100),
                efficiency: Math.min(Math.max(prediction[2] * 100, 0), 100)
            };
        } catch (error) {
            console.error('Analisis kepribadian gagal:', error);
            return {
                riskTolerance: 50,
                growthFocus: 50,
                efficiency: 50
            };
        }
    }
};

// Inisialisasi saat load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await PersonalityAnalyzer.init();
    } catch (error) {
        console.error('Gagal inisialisasi AI:', error);
        safeUpdate('personality-type', 'Sistem AI Gagal');
        safeUpdate('personality-desc', 'Analisis kepribadian tidak tersedia');
    }
});

const safeUpdate = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};

// ===== AI OOPSIE SPOTS =====
const OopsieAI = {
    model: null,
    
    init: async function() {
        // Arsitektur model untuk prediksi kesalahan
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({units: 16, activation: 'relu', inputShape: [6]}),
                tf.layers.dense({units: 8, activation: 'relu'}),
                tf.layers.dense({units: 1, activation: 'sigmoid'}) // Output: probability of error
            ]
        });
        
        // Compile model
        this.model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy'
        });
        
        // Latih dengan data sintetis
        await this.trainSyntheticData();
    },
    
    trainSyntheticData: async function() {
        // Generate 1000 sampel data sintetis
        const features = [];
        const labels = [];
        
        for(let i = 0; i < 1000; i++) {
            const data = this.generateSyntheticData();
            features.push(data.features);
            labels.push(data.label);
        }
        
        // Konversi ke tensor
        const xs = tf.tensor2d(features);
        const ys = tf.tensor2d(labels, [labels.length, 1]);
        
        // Training
        await this.model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32
        });
    },
    
    generateSyntheticData: function() {
        // Karakteristik acak untuk simulasi data
        const revenueVolatility = Math.random();
        const expenseRatio = Math.random();
        const profitMargin = Math.random();
        const cashFlow = Math.random();
        const debtRatio = Math.random();
        const growthRate = Math.random();
        
        // Label: 1 jika ada potensi kesalahan, 0 jika tidak
        const label = (revenueVolatility > 0.7 || expenseRatio > 0.8 || profitMargin < 0.1) ? 1 : 0;
        
        return {
            features: [
                revenueVolatility,
                expenseRatio,
                profitMargin,
                cashFlow,
                debtRatio,
                growthRate
            ],
            label: label
        };
    },
    
    preprocessData: function(financialData) {
        const months = financialData?.monthly || [];
        const totalRevenue = months.reduce((sum, m) => sum + m.pendapatan, 0);
        const totalExpenses = months.reduce((sum, m) => sum + m.pengeluaran, 0);
        
        return {
            revenueVolatility: this.calculateVolatility(months.map(m => m.pendapatan)),
            expenseRatio: totalRevenue > 0 ? totalExpenses / totalRevenue : 0,
            profitMargin: totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0,
            cashFlow: months.length > 0 ? months[months.length-1].laba : 0,
            debtRatio: 0, // Asumsi tidak ada data utang
            growthRate: this.calculateGrowthRate(months.map(m => m.pendapatan))
        };
    },
    
    predictErrors: async function(financialData) {
        try {
            const input = this.preprocessData(financialData);
            const inputTensor = tf.tensor2d([Object.values(input)]);
            const prediction = await this.model.predict(inputTensor).data();
            
            return prediction[0] > 0.5 ? 'High Risk' : 'Low Risk';
        } catch (error) {
            console.error('Error prediction failed:', error);
            return 'Unknown';
        }
    },
    
    getRecommendations: function(financialData) {
        const analysis = this.preprocessData(financialData);
        const recommendations = [];
        
        if (analysis.revenueVolatility > 0.7) {
            recommendations.push({
                type: 'Revenue Stability',
                message: 'Revenue shows high volatility. Consider diversifying income sources.'
            });
        }
        
        if (analysis.expenseRatio > 0.8) {
            recommendations.push({
                type: 'Expense Control',
                message: 'Expenses are too high relative to revenue. Review cost structure.'
            });
        }
        
        if (analysis.profitMargin < 0.1) {
            recommendations.push({
                type: 'Profitability',
                message: 'Profit margin is low. Explore ways to increase revenue or reduce costs.'
            });
        }
        
        return recommendations.length > 0 ? recommendations : [{
            type: 'No Major Issues',
            message: 'No significant financial risks detected. Maintain current practices.'
        }];
    }
};

// Inisialisasi AI saat load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await OopsieAI.init();
    } catch (error) {
        console.error('Oopsie AI initialization failed:', error);
    }
});

// Update Oopsie Spots card
function updateOopsieSpots() {
    const oopsieCard = document.getElementById('oopsie-spots');
    if (!oopsieCard) return;
    
    const riskLevel = OopsieAI.predictErrors(financialData);
    const recommendations = OopsieAI.getRecommendations(financialData);
    
    // Jika tidak ada rekomendasi dan risiko rendah
    if (recommendations.length === 0 && riskLevel === 'Low Risk') {
        oopsieCard.innerHTML = `
            <div class="oopsie-header">
                <h3>Oopsie Spots</h3>
                <div class="risk-level low-risk">
                    ${riskLevel}
                </div>
            </div>
            <div class="no-oopsies">
                🎉 Tidak ditemukan masalah yang signifikan
                <p class="subtext">Data finansial Anda terlihat sehat!</p>
            </div>
        `;
        return;
    }
    
    oopsieCard.innerHTML = `
        <div class="oopsie-header">
            <h3>Oopsie Spots</h3>
            <div class="risk-level ${riskLevel.toLowerCase().replace(' ', '-')}">
                ${riskLevel}
            </div>
        </div>
        <div class="oopsie-recommendations">
            ${recommendations.map(rec => `
                <div class="recommendation">
                    <div class="rec-type">${rec.type}</div>
                    <div class="rec-message">${rec.message}</div>
                </div>
            `).join('')}
        </div>
    `;
}