// serverList.js

let preferencesManager = new PreferencesManager();

// Créer une instance de PlayerInfoCache
let playerInfoCache = new PlayerInfoCache();

let systemListProvider = new SimStatusListProvider({
    endpoint: `${window.siteConfig["static-api-provider"]}simstatus.json`
});

// Passer playerInfoCache à SystemReportManager
let systemReportManager = new SystemReportManager(preferencesManager, playerInfoCache);

// Passer playerInfoCache à SystemListManager
let systemListManager = new SystemListManager(preferencesManager, systemListProvider, systemReportManager, playerInfoCache);

let refreshList = function() {
    systemListManager._tick();
    let population = systemListProvider.getPopulation();
    document.getElementById("countAmerica").innerText = population.America;
    document.getElementById("countEurope").innerText = population.Europe;
    document.getElementById("countAsia").innerText = population.Asia;
    document.getElementById("countTotal").innerText = population.World;

    updateGlobalClanTaggedPlayersList();
}

systemListProvider.on("refresh", () => {
    requestAnimationFrame(refreshList);
});

preferencesManager.on("change", () => {
    requestAnimationFrame(refreshList);
});

/* Logic for Custom Game Sharing */

document.getElementById("shareCustomGame").addEventListener("click", async() => {
    let url = document.getElementById("customGameLinkInput").value;
    let response = await fetch(
        `${window.siteConfig["static-api-provider"]}post`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url
            })
        }
    );
    let json = await response.json();
    console.log(json);
    if (json.status === "success") {
        shareGameModal.hide();
        await systemListProvider._tick();
        systemListManager._tick();
    } else if (json.error) {
        alert("Error in sharing game link.");
        shareGameModal.hide();
    }
});

function updateGlobalClanTaggedPlayersList() {
    const systems = systemListManager.getAllSystems();
    const playerSystemMap = {}; // Map pour associer les noms des joueurs aux systemId
    const allPlayerPromises = systems.map(system => {
        return playerInfoCache.fetchPlayerInfo(system)
            .then(playerInfo => {
                if (playerInfo && playerInfo.players) {
                    const players = Object.values(playerInfo.players).map(player => {
                        const playerName = player.player_name;
                        // Associer le nom du joueur au systemId
                        if (!playerSystemMap[playerName]) {
                            playerSystemMap[playerName] = system.id;
                        } else {
                            // Si le nom du joueur existe déjà, créer un tableau de systemId
                            if (!Array.isArray(playerSystemMap[playerName])) {
                                playerSystemMap[playerName] = [playerSystemMap[playerName]];
                            }
                            playerSystemMap[playerName].push(system.id);
                        }
                        return playerName;
                    });
                    return players;
                } else {
                    return [];
                }
            })
            .catch(error => {
                console.error(`Erreur lors de la récupération des joueurs pour le système ${system.id}:`, error);
                return [];
            });
    });

    Promise.all(allPlayerPromises).then(playersArrays => {
        const allPlayers = playersArrays.flat();
        renderGlobalClanTaggedPlayers(allPlayers, playerSystemMap);
    });
}

function renderGlobalClanTaggedPlayers(playerList, playerSystemMap) {

    const { clanToPlayers } = groupPlayersByClan(playerList, clans);
    const playerListElement = document.getElementById("globalClanTaggedPlayers");
    playerListElement.innerHTML = ''; // Effacer les entrées précédentes

    const clanNamesOrder = [
        "ℭ", "GOF", "NUB", "ƲԼƲ", "S&C", "FR", "PTP", "Cᴋ",
        "ƬƝⱮ", "ALONE", "₲Ⱡ", "7҉", "ɆØ₮", "☪", "SᄅF̶", "ΛꞨΞ",
        "KOR", "Ⱡ₳₣", "F4", "F℣", "G4", "ARC", "SR", "🔥IŞ", "VN",
        "L̴N̴D̴", "ȻS", "YΛ", "ŁS", "ᘖ࿐", "₩ØȻ", "ROW", "LOV", "TDR", "SOLO", "HELL"
    ];

    clanNamesOrder.forEach(clanName => {
        const players = clanToPlayers[clanName];
        if (players && players.length > 0) {
            const color = clans[clanName].color;

            // Crée une ligne Bootstrap pour chaque groupe de 3 joueurs
            let rowElement = document.createElement("div");
            rowElement.className = "row mb-2"; // Ajoute une marge entre les lignes

            players.forEach((playerName, index) => {
                const systemId = playerSystemMap[playerName];

                let playerLink;
                if (systemId) {
                    if (Array.isArray(systemId)) {
                        // Si le joueur est dans plusieurs systèmes, on utilise le premier
                        playerLink = `https://starblast.io/#${systemId[0]}`;
                    } else {
                        playerLink = `https://starblast.io/#${systemId}`;
                    }
                } else {
                    playerLink = "#";
                }

                // Crée une colonne Bootstrap pour chaque joueur
                const playerCol = document.createElement("div");
                playerCol.className = "col-4"; // Pour 3 colonnes, utiliser col-4
                playerCol.innerHTML = `<a href="${playerLink}" target="_blank" style="color: ${color}; text-decoration: none;">${playerName}</a>`;

                rowElement.appendChild(playerCol);

                // Après chaque 3 joueurs, ajoute la ligne au conteneur et crée une nouvelle ligne
                if ((index + 1) % 3 === 0) {
                    playerListElement.appendChild(rowElement);
                    rowElement = document.createElement("div");
                    rowElement.className = "row mb-2";
                }
            });

            // Ajoute la dernière ligne si elle contient moins de 3 joueurs
            if (rowElement.children.length > 0) {
                playerListElement.appendChild(rowElement);
            }
        }
    });
}