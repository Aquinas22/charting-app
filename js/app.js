import { auth, db } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Chart state
const chartState = {
    currentCycle: 1,
    currentView: 'week', // 'day', 'week', 'month'
    currentDayIndex: 0, // For day view
    userId: null,
    days: Array.from({ length: 40 }, (_, i) => ({
        day: i + 1,
        bleeding: null,
        mucusColor: [],
        mucusConsistency: [],
        sensation: null,
        isPeak: false,
        count: null,
        observations: [] // All stamps applied to this day
    }))
}

// Get background color for a stamp
function getStampColor(stamp) {
    const colorMap = {
        // Bleeding - red shades
        'H': '#ff6b6b',
        'M': '#ff8787',
        'L': '#ffa5a5',
        'VL': '#ffc9c9',
        'B': '#d7a5a5',
        
        // Mucus colors
        'C': '#e3f2fd',
        'C/K': '#f5f5f5',
        'W': '#ffffff',
        'Y': '#fff9c4',
        'Br': '#d7ccc8',
        
        // Consistency
        'T': '#dda5f7',
        'S': '#c9a5f7',
        'P': '#b5a5f7',
        'G': '#a5b5f7',
        
        // Sensations
        'D': '#ffebee',
        'Dp': '#fff3e0',
        'Sh': '#e0f2f1',
        'Sl': '#e8f5e9',
        'L': '#f3e5f5',
        
        // Quick stamps
        'RED': '#ff6b6b',
        'GREEN': '#4ecdc4',
        'WHITE': '#ffffff',
        
        // Special
        'PEAK': '#ffd700',
        'x1': '#e0e0e0',
        'x2': '#e0e0e0',
        'x3': '#e0e0e0'
    }
    return colorMap[stamp] || '#E6E6FA'
}

// Initialize chart
function initChart() {
    const chartGrid = document.getElementById('chart-grid')
    if (!chartGrid) return

    renderChart()
    setupDragAndDrop()
    setupViewButtons()
}

// Render chart grid
function renderChart() {
    const chartGrid = document.getElementById('chart-grid')
    if (!chartGrid) return
    
    chartGrid.innerHTML = ''
    
    // Determine which days to show based on view
    let daysToShow = []
    if (chartState.currentView === 'day') {
        chartGrid.style.gridTemplateColumns = 'repeat(1, 1fr)'
        daysToShow = [chartState.days[chartState.currentDayIndex]]
    } else if (chartState.currentView === 'week') {
        chartGrid.style.gridTemplateColumns = 'repeat(7, 1fr)'
        daysToShow = chartState.days.slice(0, 7)
    } else if (chartState.currentView === 'month') {
        chartGrid.style.gridTemplateColumns = 'repeat(10, 1fr)'
        daysToShow = chartState.days.slice(0, 30)
    }

    daysToShow.forEach((day, arrayIndex) => {
        // Get the actual index in the full days array
        let actualIndex
        if (chartState.currentView === 'day') {
            actualIndex = chartState.currentDayIndex
        } else if (chartState.currentView === 'week') {
            actualIndex = arrayIndex
        } else {
            actualIndex = arrayIndex
        }
        
        const cell = document.createElement('div')
        cell.className = 'grid-cell'
        cell.dataset.dayIndex = actualIndex

        // Determine cell background color based on observations
        let cellBgColor = 'rgba(255, 255, 255, 0.8)'
        if (day.observations.length > 0) {
            // Use the first observation's color (primary indicator)
            cellBgColor = getStampColor(day.observations[0])
        }

        cell.innerHTML = `
            <div class="cell-header">Day ${day.day}</div>
            <div class="cell-observations" id="obs-${actualIndex}">
                ${day.observations.map(obs => `<span class="obs-stamp">${obs}</span>`).join('')}
            </div>
            <button class="clear-day" data-day="${actualIndex}" title="Clear this day">×</button>
        `
        
        // Apply background color
        cell.style.backgroundColor = cellBgColor
        
        // Adjust text color for better contrast on dark backgrounds
        if (['H', 'M', 'PEAK', 'RED', 'GREEN'].includes(day.observations[0])) {
            cell.style.color = '#ffffff'
            cell.querySelector('.cell-header').style.color = '#ffffff'
        }

        // Allow drop
        cell.addEventListener('dragover', (e) => {
            e.preventDefault()
            cell.classList.add('drag-over')
        })

        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drag-over')
        })

        cell.addEventListener('drop', (e) => {
            e.preventDefault()
            cell.classList.remove('drag-over')
            const stamp = e.dataTransfer.getData('stamp')
            if (stamp) {
                addObservation(actualIndex, stamp)
            }
        })

        chartGrid.appendChild(cell)
    })
    
    // Add navigation for day view
    if (chartState.currentView === 'day') {
        addDayNavigation()
    }

    // Add clear day button handlers
    document.querySelectorAll('.clear-day').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const dayIndex = parseInt(btn.dataset.day)
            clearDay(dayIndex)
        })
    })
}

// Add navigation buttons for day view
function addDayNavigation() {
    const chartHeader = document.querySelector('.chart-header')
    let navDiv = document.getElementById('day-navigation')
    
    if (!navDiv) {
        navDiv = document.createElement('div')
        navDiv.id = 'day-navigation'
        navDiv.style.cssText = 'display: flex; gap: 10px; align-items: center;'
        
        const prevBtn = document.createElement('button')
        prevBtn.textContent = '← Prev'
        prevBtn.className = 'btn-view-option'
        prevBtn.onclick = () => {
            if (chartState.currentDayIndex > 0) {
                chartState.currentDayIndex--
                renderChart()
            }
        }
        
        const nextBtn = document.createElement('button')
        nextBtn.textContent = 'Next →'
        nextBtn.className = 'btn-view-option'
        nextBtn.onclick = () => {
            if (chartState.currentDayIndex < chartState.days.length - 1) {
                chartState.currentDayIndex++
                renderChart()
            }
        }
        
        const dayCounter = document.createElement('span')
        dayCounter.id = 'day-counter'
        dayCounter.style.fontWeight = '600'
        
        navDiv.appendChild(prevBtn)
        navDiv.appendChild(dayCounter)
        navDiv.appendChild(nextBtn)
        
        chartHeader.appendChild(navDiv)
    }
    
    // Update counter
    const dayCounter = document.getElementById('day-counter')
    if (dayCounter) {
        dayCounter.textContent = `Day ${chartState.currentDayIndex + 1} of ${chartState.days.length}`
    }
}

// Setup view buttons
function setupViewButtons() {
    const dayBtn = document.getElementById('day-view-btn')
    const weekBtn = document.getElementById('week-view-btn')
    const monthBtn = document.getElementById('month-view-btn')
    
    if (!dayBtn || !weekBtn || !monthBtn) return
    
    const updateActiveButton = () => {
        dayBtn.classList.toggle('active', chartState.currentView === 'day')
        weekBtn.classList.toggle('active', chartState.currentView === 'week')
        monthBtn.classList.toggle('active', chartState.currentView === 'month')
    }
    
    dayBtn.addEventListener('click', () => {
        chartState.currentView = 'day'
        updateActiveButton()
        renderChart()
    })
    
    weekBtn.addEventListener('click', () => {
        chartState.currentView = 'week'
        updateActiveButton()
        renderChart()
    })
    
    monthBtn.addEventListener('click', () => {
        chartState.currentView = 'month'
        updateActiveButton()
        renderChart()
    })
    
    updateActiveButton()
}

// Setup drag and drop for stamps
function setupDragAndDrop() {
    document.querySelectorAll('.stamp').forEach(stamp => {
        stamp.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('stamp', stamp.dataset.stamp)
            stamp.classList.add('dragging')
        })

        stamp.addEventListener('dragend', () => {
            stamp.classList.remove('dragging')
        })
    })
}

// Add observation to a day
function addObservation(dayIndex, stamp) {
    const day = chartState.days[dayIndex]

    // Handle special cases
    if (stamp === 'PEAK') {
        // Clear other peak days
        chartState.days.forEach(d => d.isPeak = false)
        day.isPeak = true
    }

    // Add to observations if not duplicate
    if (!day.observations.includes(stamp)) {
        day.observations.push(stamp)
    }

    renderChart()
    saveChartData()
}

// Clear all observations from a day
function clearDay(dayIndex) {
    const day = chartState.days[dayIndex]
    day.observations = []
    day.bleeding = null
    day.mucusColor = []
    day.mucusConsistency = []
    day.sensation = null
    day.isPeak = false
    day.count = null
    renderChart()
    saveChartData()
}

// Save chart data to Firestore
async function saveChartData() {
    // Skip saving if in guest mode
    if (window.IS_GUEST_MODE || !chartState.userId) return
    
    try {
        const userDocRef = doc(db, 'users', chartState.userId)
        await setDoc(userDocRef, {
            currentCycle: chartState.currentCycle,
            days: chartState.days,
            lastUpdated: new Date().toISOString()
        }, { merge: true })
        console.log('Chart data saved successfully')
    } catch (error) {
        console.error('Error saving chart data:', error)
    }
}

// Load chart data from Firestore
async function loadChartData(userId) {
    try {
        const userDocRef = doc(db, 'users', userId)
        const docSnap = await getDoc(userDocRef)
        
        if (docSnap.exists()) {
            const data = docSnap.data()
            chartState.currentCycle = data.currentCycle || 1
            chartState.days = data.days || chartState.days
            renderChart()
            console.log('Chart data loaded successfully')
        } else {
            console.log('No saved data found, starting fresh')
        }
    } catch (error) {
        console.error('Error loading chart data:', error)
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        chartState.userId = user.uid
        loadChartData(user.uid)
    } else {
        chartState.userId = null
    }
})

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChart)
} else {
    initChart()
}

// Add cycle button handler
document.getElementById('add-cycle-btn')?.addEventListener('click', () => {
    chartState.currentCycle++
    chartState.days = Array.from({ length: 40 }, (_, i) => ({
        day: i + 1,
        bleeding: null,
        mucusColor: [],
        mucusConsistency: [],
        sensation: null,
        isPeak: false,
        count: null,
        observations: []
    }))
    renderChart()
})
