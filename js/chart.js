const chartGrid = document.getElementById('chartGrid');

// Generate 42 squares (7 days × 6 weeks)
for (let i = 0; i < 42; i++) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.setAttribute('draggable', true);
    square.textContent = '';

    // Drag events
    square.addEventListener('dragstart', (e) => {
        square.classList.add('dragging');
        e.dataTransfer.setData('text/plain', i);
    });

    square.addEventListener('dragend', () => {
        square.classList.remove('dragging');
    });

    chartGrid.appendChild(square);
}

// Drag and drop handling
chartGrid.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const target = e.target;
    if (target.classList.contains('square') && target !== dragging) {
        chartGrid.insertBefore(dragging, target.nextSibling);
    }
});
