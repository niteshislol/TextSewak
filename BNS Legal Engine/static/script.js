document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const firInput = document.getElementById('firInput');
    const resultsSection = document.getElementById('resultsSection');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const templateName = document.getElementById('templateName');
    const analysisMode = document.getElementById('analysisMode');
    const confidenceScore = document.getElementById('confidenceScore');
    const customMessage = document.getElementById('customMessage');
    const loader = document.getElementById('loader');

    // Language Toggle Logic
    let currentLang = 'hi';
    const langBtns = document.querySelectorAll('.lang-btn');

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLang = btn.dataset.lang;
        });
    });

    clearBtn.addEventListener('click', () => {
        firInput.value = '';
        resultsSection.classList.add('hidden');
    });

    analyzeBtn.addEventListener('click', async () => {
        const text = firInput.value.trim();
        if (!text) {
            alert('Please enter some text to analyze.');
            return;
        }

        // Show loader, hide results
        loader.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fir_text: text,
                    language: currentLang
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during analysis. Check console for details.');
        } finally {
            loader.classList.add('hidden');
        }
    });

    function displayResults(data) {
        resultsSection.classList.remove('hidden');

        // Update status bar
        templateName.textContent = data.matched_template || 'Unknown';

        if (data.is_fallback) {
            analysisMode.textContent = 'Semantic Fallback Mode';
            analysisMode.style.color = 'var(--warning)';
        } else {
            analysisMode.textContent = 'Rule-Based Exact Match';
            analysisMode.style.color = 'var(--success)';
        }

        const score = data.confidence_score ? (data.confidence_score * 100).toFixed(1) + '%' : 'N/A';
        confidenceScore.textContent = score;

        // Custom Message (Rule based warning)
        if (data.custom_message) {
            customMessage.textContent = data.custom_message;
            customMessage.classList.remove('hidden');
        } else {
            customMessage.classList.add('hidden');
        }

        // Render Sections
        sectionsContainer.innerHTML = '';
        if (data.relevant_sections && data.relevant_sections.length > 0) {
            data.relevant_sections.forEach(section => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h4>Chapter ${section.chapter}: ${section.chapter_title}</h4>
                    <h3>Section ${section.Section}</h3>
                    <h5>${section.section_title}</h5>
                    <p>${section.section_desc}</p>
                `;
                sectionsContainer.appendChild(card);
            });
        } else {
            sectionsContainer.innerHTML = '<p style="color:var(--text-secondary)">No specific sections matched.</p>';
        }
    }
});
