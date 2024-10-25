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

let refreshList = function () {
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

document.getElementById("shareCustomGame").addEventListener("click", async () => {
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
    const playerInfoList = []; // Liste pour stocker les infos des joueurs avec la région
    const allPlayerPromises = systems.map(system => {
        return playerInfoCache.fetchPlayerInfo(system)
            .then(playerInfo => {
                if (playerInfo && playerInfo.players) {
                    const players = Object.values(playerInfo.players).map(player => {
                        const playerName = player.player_name;
                        const region = system.region; // Obtenir la région du système
                        // Ajouter les informations du joueur à la liste
                        playerInfoList.push({
                            name: playerName,
                            systemId: system.id,
                            region: region
                        });
                        // Associer le nom du joueur au systemId (pour les liens)
                        if (!playerSystemMap[playerName]) {
                            playerSystemMap[playerName] = system.id;
                        } else {
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

    Promise.all(allPlayerPromises).then(() => {
        renderGlobalClanTaggedPlayers(playerInfoList, playerSystemMap);
    });
}

function renderGlobalClanTaggedPlayers(playerInfoList, playerSystemMap) {

    const playersByRegion = {};
    playerInfoList.forEach(playerInfo => {
        const region = playerInfo.region;
        if (!playersByRegion[region]) {
            playersByRegion[region] = [];
        }
        playersByRegion[region].push(playerInfo);
    });

    const playerListElement = document.getElementById("globalClanTaggedPlayers");
    playerListElement.innerHTML = ''; // Effacer les entrées précédentes

    const regionOrder = ['America', 'Europe', 'Asia']; // Définir l'ordre des régions

    regionOrder.forEach(region => {
        const playersInRegion = playersByRegion[region];
        if (playersInRegion && playersInRegion.length > 0) {

            // Extraire les noms des joueurs
            const playerNames = playersInRegion.map(p => p.name);

            // Utiliser groupPlayersByClan pour regrouper les joueurs par clan
            const { clanToPlayers } = groupPlayersByClan(playerNames, clans);

            // Vérifier s'il y a des joueurs avec des tags de clan dans cette région
            const hasClanPlayers = Object.values(clanToPlayers).some(clanPlayers => clanPlayers.length > 0);

            if (hasClanPlayers) {
                // Créer un en-tête pour la région
                const regionHeader = document.createElement('h5');
                regionHeader.textContent = region;
                regionHeader.className = 'text-center text-white mt-4';
                playerListElement.appendChild(regionHeader);

                const clanNamesOrder = [
                    "ℭ", "GOF", "NUB", "ƲԼƲ", "S&C", "FR", "PTP", "Cᴋ",
                    "ƬƝⱮ", "ALONE", "₲Ⱡ", "7҉", "ɆØȮ", "☪", "SᄅF̶", "ΛꞨΞ",
                    "KOR", "Ⱡ₳₣", "F4", "F℣", "G4", "ARC", "SR", "🔥IŞ", "VN",
                    "L̴N̴D̴", "ȻS", "YΛ", "ŁS", "ᘖ࿐", "₩ØȮ", "ROW", "LOV", "TDR", "SOLO", "HELL"
                ];

                clanNamesOrder.forEach(clanName => {
                    const clanPlayers = clanToPlayers[clanName];
                    if (clanPlayers && clanPlayers.length > 0) {
                        const color = clans[clanName].color;

                        // Créer des lignes Bootstrap pour les joueurs
                        let rowElement = document.createElement("div");
                        rowElement.className = "row mb-2";

                        clanPlayers.forEach((playerName, index) => {
                            const systemId = playerSystemMap[playerName];

                            let playerLink;
                            if (systemId) {
                                if (Array.isArray(systemId)) {
                                    playerLink = `https://starblast.io/#${systemId[0]}`;
                                } else {
                                    playerLink = `https://starblast.io/#${systemId}`;
                                }
                            } else {
                                playerLink = "#";
                            }

                            // Créer une colonne pour chaque joueur
                            const playerCol = document.createElement("div");
                            playerCol.className = "col-4";
                            playerCol.innerHTML = `<a href="${playerLink}" target="_blank" style="color: ${color}; text-decoration: none;">${playerName}</a>`;

                            rowElement.appendChild(playerCol);

                            // Après chaque 3 joueurs, ajouter la ligne et en créer une nouvelle
                            if ((index + 1) % 3 === 0) {
                                playerListElement.appendChild(rowElement);
                                rowElement = document.createElement("div");
                                rowElement.className = "row mb-2";
                            }
                        });

                        // Ajouter la dernière ligne si elle contient des joueurs
                        if (rowElement.children.length > 0) {
                            playerListElement.appendChild(rowElement);
                        }
                    }
                });
            }
        }
    });
}