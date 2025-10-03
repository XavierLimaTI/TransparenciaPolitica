// Main application logic
let currentDeputies = [...deputiesData];
let currentVotings = [...votingsData];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeSearch();
    initializePartyFilter();
    renderDeputies();
    renderVotings();
    initializeModal();
});

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        currentDeputies = deputiesData.filter(deputy => 
            deputy.name.toLowerCase().includes(searchTerm) ||
            deputy.party.toLowerCase().includes(searchTerm) ||
            deputy.state.toLowerCase().includes(searchTerm)
        );
        renderDeputies();
    });
}

// Party filter functionality
function initializePartyFilter() {
    const filterSelect = document.getElementById('filterParty');
    
    // Get unique parties
    const parties = [...new Set(deputiesData.map(d => d.party))].sort();
    
    // Populate filter dropdown
    parties.forEach(party => {
        const option = document.createElement('option');
        option.value = party;
        option.textContent = party;
        filterSelect.appendChild(option);
    });
    
    // Add event listener
    filterSelect.addEventListener('change', (e) => {
        const selectedParty = e.target.value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        currentDeputies = deputiesData.filter(deputy => {
            const matchesSearch = deputy.name.toLowerCase().includes(searchTerm) ||
                                deputy.party.toLowerCase().includes(searchTerm) ||
                                deputy.state.toLowerCase().includes(searchTerm);
            const matchesParty = !selectedParty || deputy.party === selectedParty;
            return matchesSearch && matchesParty;
        });
        
        renderDeputies();
    });
}

// Render deputies list
function renderDeputies() {
    const deputiesList = document.getElementById('deputiesList');
    
    if (currentDeputies.length === 0) {
        deputiesList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Nenhum deputado encontrado.</p>';
        return;
    }
    
    deputiesList.innerHTML = currentDeputies.map(deputy => `
        <div class="deputy-card" onclick="showDeputyDetails(${deputy.id})">
            <div class="deputy-header">
                <div class="deputy-avatar">${deputy.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                <div class="deputy-info">
                    <h3>${deputy.name}</h3>
                    <p class="deputy-party">${deputy.party} - ${deputy.state}</p>
                </div>
            </div>
            <div class="deputy-details">
                <p><strong>Email:</strong> ${deputy.email}</p>
                <p><strong>Telefone:</strong> ${deputy.phone}</p>
            </div>
        </div>
    `).join('');
}

// Render votings list
function renderVotings() {
    const votingsList = document.getElementById('votingsList');
    
    votingsList.innerHTML = currentVotings.map(voting => {
        const votesSummary = calculateVotesSummary(voting.votes);
        
        return `
            <div class="voting-card">
                <div class="voting-header">
                    <h3>${voting.title}</h3>
                    <p class="voting-date">Data: ${voting.date}</p>
                    <p style="margin-top: 0.5rem; color: #555;">${voting.description}</p>
                </div>
                
                <div class="votes-summary">
                    <div class="vote-count sim">✓ Sim: ${votesSummary.sim}</div>
                    <div class="vote-count nao">✗ Não: ${votesSummary.nao}</div>
                    <div class="vote-count abstencao">⊘ Abstenção: ${votesSummary.abstencao}</div>
                </div>
                
                <div class="votes-detail">
                    <h4 style="margin-bottom: 0.75rem;">Votos dos Deputados:</h4>
                    ${voting.votes.map(vote => `
                        <div class="vote-item">
                            <span>${vote.deputyName}</span>
                            <span class="vote-badge ${vote.vote}">${getVoteLabel(vote.vote)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Calculate votes summary
function calculateVotesSummary(votes) {
    return votes.reduce((acc, vote) => {
        acc[vote.vote] = (acc[vote.vote] || 0) + 1;
        return acc;
    }, { sim: 0, nao: 0, abstencao: 0 });
}

// Get vote label in Portuguese
function getVoteLabel(vote) {
    const labels = {
        'sim': 'Sim',
        'nao': 'Não',
        'abstencao': 'Abstenção'
    };
    return labels[vote] || vote;
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Show deputy details in modal
function showDeputyDetails(deputyId) {
    const deputy = deputiesData.find(d => d.id === deputyId);
    if (!deputy) return;
    
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    
    // Get voting history for this deputy
    const deputyVotes = currentVotings.map(voting => {
        const vote = voting.votes.find(v => v.deputyId === deputyId);
        return vote ? {
            voting: voting.title,
            vote: vote.vote,
            date: voting.date
        } : null;
    }).filter(v => v !== null);
    
    modalBody.innerHTML = `
        <div class="modal-deputy-header">
            <div class="modal-avatar">${deputy.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
            <h2>${deputy.name}</h2>
            <p style="color: #666; font-size: 1.1rem;">${deputy.party} - ${deputy.state}</p>
        </div>
        
        <div class="modal-deputy-info">
            <p><strong>Email:</strong> ${deputy.email}</p>
            <p><strong>Telefone:</strong> ${deputy.phone}</p>
            <p style="margin-bottom: 0;"><strong>Partido:</strong> ${deputy.party}</p>
        </div>
        
        <h3 style="margin-bottom: 1rem;">Sobre</h3>
        <p class="modal-deputy-bio">${deputy.bio}</p>
        
        <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Histórico de Votações</h3>
        <div class="votes-detail">
            ${deputyVotes.map(v => `
                <div class="vote-item">
                    <div>
                        <div style="font-weight: 500;">${v.voting}</div>
                        <div style="font-size: 0.85rem; color: #666;">${v.date}</div>
                    </div>
                    <span class="vote-badge ${v.vote}">${getVoteLabel(v.vote)}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.classList.add('active');
}
