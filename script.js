// Inisialisasi aplikasi antrian
document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const queueNumberInput = document.getElementById('queue-number');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    const callBtn = document.getElementById('call-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetBtn = document.getElementById('reset-btn');
    const testVoiceBtn = document.getElementById('test-voice-btn');
    const operatorsGrid = document.querySelector('.operators-grid');
    const currentQueueDisplay = document.getElementById('current-queue-display');
    const currentOperatorDisplay = document.getElementById('current-operator-display');
    const statusDisplay = document.getElementById('status-display');
    const historyList = document.querySelector('.history-list');
    const servingList = document.querySelector('.serving-list');
    const statusGrid = document.querySelector('.status-grid');
    const dateTimeElement = document.getElementById('date-time');
    const queueCountElement = document.getElementById('queue-count');
    const notification = document.getElementById('notification');
    const notificationText = document.querySelector('.notification-text');
    const bellSound = document.getElementById('bell-sound');
    const volumeSlider = document.getElementById('voice-volume');
    const rateSlider = document.getElementById('voice-rate');
    const volumeValue = document.getElementById('volume-value');
    const rateValue = document.getElementById('rate-value');
    
    // State aplikasi
    let currentQueue = parseInt(queueNumberInput.value);
    let selectedOperator = 'Operator 1';
    let calledQueues = [];
    let queueHistory = [];
    let queueCount = 0;
    let operators = [
        { id: 1, name: 'Operator 1', status: 'available', currentQueue: null },
        { id: 2, name: 'Operator 2', status: 'available', currentQueue: null },
        { id: 3, name: 'Operator 3', status: 'available', currentQueue: null },
        { id: 4, name: 'Operator 4', status: 'available', currentQueue: null },
        { id: 5, name: 'Operator 5', status: 'available', currentQueue: null },
        { id: 6, name: 'Operator 6', status: 'available', currentQueue: null },
        { id: 7, name: 'Operator 7', status: 'available', currentQueue: null },
        { id: 8, name: 'Operator 8', status: 'available', currentQueue: null }
    ];
    
    // Inisialisasi Web Speech API
    const speech = window.speechSynthesis;
    let voices = [];
    
    // Fungsi untuk mendapatkan suara wanita
    function getFemaleVoice() {
        // Cari suara wanita (biasanya suara wanita memiliki bahasa lokal)
        const femaleVoices = voices.filter(voice => {
            return voice.lang.startsWith('id') || 
                   voice.lang.startsWith('en') || 
                   voice.name.toLowerCase().includes('female') ||
                   voice.name.toLowerCase().includes('perempuan') ||
                   voice.name.toLowerCase().includes('wanita');
        });
        
        // Prioritaskan suara Indonesia
        const indonesianVoice = femaleVoices.find(voice => voice.lang.startsWith('id'));
        if (indonesianVoice) return indonesianVoice;
        
        // Jika tidak ada, ambil suara Inggris wanita
        const englishFemaleVoice = femaleVoices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
        );
        if (englishFemaleVoice) return englishFemaleVoice;
        
        // Jika masih tidak ada, ambil suara wanita pertama yang tersedia
        if (femaleVoices.length > 0) return femaleVoices[0];
        
        // Default: suara pertama yang tersedia
        return voices[0];
    }
    
    // Tunggu sampai suara tersedia
    speech.onvoiceschanged = function() {
        voices = speech.getVoices();
        // Jika tidak ada suara yang tersedia, gunakan fallback
        if (voices.length === 0) {
            console.warn('Web Speech API tidak mendukung suara di browser ini');
        }
    };
    
    // Fungsi untuk berbicara
    function speak(text) {
        if (speech.speaking) {
            speech.cancel();
        }
        
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = parseFloat(volumeSlider.value);
            utterance.rate = parseFloat(rateSlider.value);
            
            // Coba set suara wanita jika tersedia
            if (voices.length > 0) {
                const femaleVoice = getFemaleVoice();
                if (femaleVoice) {
                    utterance.voice = femaleVoice;
                }
            }
            
            utterance.lang = 'id-ID';
            speech.speak(utterance);
        }, 300);
    }
    
    // Fungsi untuk memperbarui tampilan
    function updateDisplay() {
        // Update tampilan nomor antrian
        currentQueueDisplay.querySelector('.queue-value').textContent = currentQueue;
        currentOperatorDisplay.querySelector('.operator-value').textContent = selectedOperator;
        
        // Update input nomor antrian
        queueNumberInput.value = currentQueue;
        
        // Update jumlah antrian yang telah dipanggil
        queueCountElement.textContent = queueCount;
    }
    
    // Fungsi untuk membuat tombol operator
    function createOperatorButtons() {
        operatorsGrid.innerHTML = '';
        
        operators.forEach(operator => {
            const button = document.createElement('button');
            button.className = `operator-btn ${selectedOperator === operator.name ? 'active' : ''}`;
            button.textContent = operator.name;
            button.dataset.id = operator.id;
            button.dataset.name = operator.name;
            
            button.addEventListener('click', function() {
                // Hapus kelas active dari semua tombol
                document.querySelectorAll('.operator-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Tambahkan kelas active ke tombol yang diklik
                this.classList.add('active');
                selectedOperator = this.dataset.name;
                updateDisplay();
            });
            
            operatorsGrid.appendChild(button);
        });
    }
    
    // Fungsi untuk membuat status operator
    function createOperatorStatus() {
        statusGrid.innerHTML = '';
        
        operators.forEach(operator => {
            const statusItem = document.createElement('div');
            statusItem.className = `status-item ${operator.status}`;
            
            const statusText = operator.status === 'available' ? 'Tersedia' : 'Sibuk';
            const statusClass = operator.status === 'available' ? 'available' : 'busy';
            
            statusItem.innerHTML = `
                <h5>${operator.name}</h5>
                <p class="${statusClass}">${statusText}</p>
                ${operator.currentQueue ? `<p class="current-queue">Antrian: ${operator.currentQueue}</p>` : ''}
            `;
            
            statusGrid.appendChild(statusItem);
        });
    }
    
    // Fungsi untuk menambahkan riwayat pemanggilan
    function addToHistory(queueNumber, operatorName) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-info">
                <div>
                    <div class="history-number">Antrian ${queueNumber}</div>
                    <div class="history-operator">${operatorName}</div>
                </div>
                <div class="history-time">${timeString}</div>
            </div>
        `;
        
        // Tambahkan ke awal daftar riwayat
        historyList.prepend(historyItem);
        
        // Simpan ke array riwayat
        queueHistory.unshift({
            queueNumber,
            operatorName,
            time: timeString
        });
        
        // Batasi riwayat maksimal 10 item
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
            queueHistory.pop();
        }
    }
    
    // Fungsi untuk memperbarui daftar yang sedang dilayani
    function updateServingList() {
        // Kosongkan daftar
        servingList.innerHTML = '';
        
        // Filter operator yang sedang melayani antrian
        const busyOperators = operators.filter(op => op.currentQueue !== null);
        
        if (busyOperators.length === 0) {
            servingList.innerHTML = '<div class="empty-message">Tidak ada antrian yang sedang dilayani</div>';
            return;
        }
        
        // Tambahkan setiap operator yang sibuk
        busyOperators.forEach(operator => {
            const servingItem = document.createElement('div');
            servingItem.className = 'serving-item';
            servingItem.innerHTML = `
                <div class="serving-info">
                    <div class="serving-number">Antrian ${operator.currentQueue}</div>
                    <div class="serving-operator">${operator.name}</div>
                </div>
                <div class="serving-time">Sedang dilayani</div>
            `;
            servingList.appendChild(servingItem);
        });
    }
    
    // Fungsi untuk menampilkan notifikasi
    function showNotification(message, type = 'success') {
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Fungsi untuk memperbarui tanggal dan waktu
    function updateDateTime() {
        const now = new Date();
        const dateString = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        dateTimeElement.textContent = `${dateString} - ${timeString}`;
    }
    
    // Fungsi untuk memanggil antrian
    function callQueue() {
        // Perbarui status tampilan
        statusDisplay.textContent = 'Dipanggil';
        statusDisplay.className = 'status-value called';
        
        // Perbarui status operator
        const operatorIndex = operators.findIndex(op => op.name === selectedOperator);
        if (operatorIndex !== -1) {
            operators[operatorIndex].status = 'busy';
            operators[operatorIndex].currentQueue = currentQueue;
            createOperatorStatus();
            updateServingList();
        }
        
        // Mainkan suara bel
        bellSound.currentTime = 0;
        bellSound.play();
        
        // Buat pesan untuk diucapkan
        const speechText = `Nomor antrian ${currentQueue}, silakan menuju ${selectedOperator}`;
        
        // Ucapkan pesan
        speak(speechText);
        
        // Tambahkan ke riwayat
        addToHistory(currentQueue, selectedOperator);
        
        // Tambahkan ke daftar antrian yang dipanggil
        calledQueues.push(currentQueue);
        
        // Tingkatkan counter
        queueCount++;
        
        // Tampilkan notifikasi
        showNotification(`Antrian ${currentQueue} berhasil dipanggil menuju ${selectedOperator}`);
    }
    
    // Fungsi untuk pindah ke antrian berikutnya
    function nextQueue() {
        // Reset status operator sebelumnya
        const operatorIndex = operators.findIndex(op => op.name === selectedOperator);
        if (operatorIndex !== -1 && operators[operatorIndex].currentQueue === currentQueue) {
            operators[operatorIndex].status = 'available';
            operators[operatorIndex].currentQueue = null;
            createOperatorStatus();
            updateServingList();
        }
        
        // Naikkan nomor antrian
        currentQueue++;
        
        // Reset status tampilan
        statusDisplay.textContent = 'Menunggu';
        statusDisplay.className = 'status-value waiting';
        
        // Perbarui tampilan
        updateDisplay();
        
        // Tampilkan notifikasi
        showNotification(`Sekarang menunggu antrian nomor ${currentQueue}`);
    }
    
    // Fungsi untuk mereset antrian
    function resetQueue() {
        if (confirm('Apakah Anda yakin ingin mereset antrian? Riwayat akan dihapus.')) {
            // Reset state
            currentQueue = 1;
            selectedOperator = 'Operator 1';
            calledQueues = [];
            queueHistory = [];
            queueCount = 0;
            
            // Reset operator
            operators.forEach(op => {
                op.status = 'available';
                op.currentQueue = null;
            });
            
            // Perbarui tampilan
            updateDisplay();
            createOperatorButtons();
            createOperatorStatus();
            updateServingList();
            
            // Kosongkan riwayat
            historyList.innerHTML = '';
            
            // Reset status tampilan
            statusDisplay.textContent = 'Menunggu';
            statusDisplay.className = 'status-value waiting';
            
            // Tampilkan notifikasi
            showNotification('Antrian telah direset', 'info');
        }
    }
    
    // Event Listeners
    decreaseBtn.addEventListener('click', function() {
        if (currentQueue > 1) {
            currentQueue--;
            updateDisplay();
        }
    });
    
    increaseBtn.addEventListener('click', function() {
        currentQueue++;
        updateDisplay();
    });
    
    queueNumberInput.addEventListener('change', function() {
        const value = parseInt(this.value);
        if (value >= 1) {
            currentQueue = value;
            updateDisplay();
        } else {
            this.value = currentQueue;
        }
    });
    
    callBtn.addEventListener('click', callQueue);
    
    nextBtn.addEventListener('click', nextQueue);
    
    resetBtn.addEventListener('click', resetQueue);
    
    testVoiceBtn.addEventListener('click', function() {
        const testText = 'Ini adalah uji suara untuk sistem antrian SPMB SMA Negeri 1 Magetan.';
        speak(testText);
        showNotification('Menguji suara...', 'info');
    });
    
    volumeSlider.addEventListener('input', function() {
        const volumePercent = Math.round(this.value * 100);
        volumeValue.textContent = `${volumePercent}%`;
        bellSound.volume = this.value;
    });
    
    rateSlider.addEventListener('input', function() {
        const rate = parseFloat(this.value);
        let rateText = 'Normal';
        
        if (rate < 1) {
            rateText = 'Lambat';
        } else if (rate > 1) {
            rateText = 'Cepat';
        }
        
        rateValue.textContent = rateText;
    });
    
    // Inisialisasi
    function init() {
        // Buat tombol operator
        createOperatorButtons();
        
        // Buat status operator
        createOperatorStatus();
        
        // Perbarui tampilan
        updateDisplay();
        
        // Perbarui tanggal dan waktu secara real-time
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Tampilkan notifikasi selamat datang
        setTimeout(() => {
            showNotification('Sistem Antrian SPMB SMA Negeri 1 Magetan siap digunakan', 'success');
        }, 1000);
        
        // Inisialisasi Web Speech API jika browser mendukung
        if ('speechSynthesis' in window) {
            // Memuat suara
            voices = speech.getVoices();
            if (voices.length === 0) {
                speech.onvoiceschanged = () => {
                    voices = speech.getVoices();
                };
            }
        } else {
            alert('Browser Anda tidak mendukung Web Speech API. Fitur suara tidak akan berfungsi.');
        }
    }
    
    // Jalankan inisialisasi
    init();
});