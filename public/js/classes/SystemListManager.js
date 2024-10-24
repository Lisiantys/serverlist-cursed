class SystemListManager {
    constructor(preferencesManager, systemListProvider, systemReportManager) {
        const self = this;

        self.preferencesManager = preferencesManager;
        self.systemListProvider = systemListProvider;
        self.systemReportManager = systemReportManager;

        self.systemCards = {};
        self.systemsById = {};
        self.systemListElement = document.getElementById("systemsList");

        //Récupération joueurs pour afficher tag + count sur chaque card/systeme
        this.playerInfoBySystemId = {};
    }

    fetchPlayerInfo(system) {
        const self = this;
        let systemId = `${system.id}@${system.address}`;
    
        // Vérifier si les informations sont déjà en cache et récentes
        if (self.playerInfoBySystemId[systemId] &&
            Date.now() - self.playerInfoBySystemId[systemId].timestamp < 10000) {
            // Déjà récupéré récemment
            return;
        }
    
        // Marquer comme en cours de récupération
        self.playerInfoBySystemId[systemId] = {
            inProgress: true,
            timestamp: Date.now(),
        };
    
        // Récupérer les informations des joueurs
        fetch(`${window.siteConfig["static-api-provider"]}status/${systemId}`)
            .then(async (response) => {
                let info = await response.json();
                self.playerInfoBySystemId[systemId].data = info;
                self.playerInfoBySystemId[systemId].inProgress = false;
    
                // Mettre à jour la carte si elle existe
                if (self.systemCards[system.id.toString()]) {
                    self.systemCards[system.id.toString()].innerHTML = self.getCardHTML(system);
                }
            })
            .catch((error) => {
                console.error(`Erreur lors de la récupération des informations des joueurs pour le système ${systemId}:`, error);
                self.playerInfoBySystemId[systemId].inProgress = false;
            });
    }

    getCardHTML(system) {
        const clans = {
            "GOF": {
              tags: ["GOF", "ɢᴏҒ", "ɢᴏꜰ"],
              color: "#00FF00", // Lime
            },
            "FR": {
              tags: ["FЯ", "ҒꝚ"],
              color: "#4682B4", // SteelBlue
            },
            "🔥IŞ": {
              tags: ["🔥IŞ", "🔥IS"],
              color: "#FF7F50", // Coral
            },
            "VN": {
              tags: ["VN", "℣ƗɆ", "ѴИ"],
              color: "#D3D3D3", // LightGray
            },
            "F4": {
              tags: ["⌥Ƒᔦ", "⌥Ƒ౺", "F4"],
              color: "#FF8C00", // DarkOrange
            },
            "PTP": {
              tags: ["PTP", "P͠T͠P͠"],
              color: "#32CD32",
            },
            "SR": { 
              tags: ["​ꞨⱤ"],
              color: "#808080"
            },
            // Ajoutez les autres clans avec leurs tags correspondants
            "ᘜA̷ᖇ": { tags: ["ᘜA̷ᖇ"], color: "#FFF000" },
            "NUB": { tags: ["NUB"], color: "#FFA500" },
            "ƲԼƲ": { tags: ["ƲԼƲ"], color: "#800080" },
            "S&C": { tags: ["S&C"], color: "#00BFFF" },
            "Cᴋ": { tags: ["Cᴋ"], color: "#40E0D0" },
            "ƬƝⱮ": { tags: ["ƬƝⱮ"], color: "#FF00FF" },
            "ALONE": { tags: ["ALONE"], color: "#CD853F" },
            "₲Ⱡ": { tags: ["₲Ⱡ"], color: "#1E90FF" },
            "ℭ": { tags: ["ℭ"], color: "#FF0000" },
            "7҉": { tags: ["7҉"], color: "#FFD700" },
            "ɆØ₮": { tags: ["ɆØ₮"], color: "#00FFFF" },
            "☪": { tags: ["☪"], color: "#FF69B4" },
            "SᄅF̶": { tags: ["SᄅF̶"], color: "#ADFF2F" },
            "ΛꞨΞ": { tags: ["ΛꞨΞ"], color: "#FF4500" },
            "KOR": { tags: ["KOR"], color: "#DC143C" },
            "Ⱡ₳₣": { tags: ["Ⱡ₳₣"], color: "#9ACD32" },
            "F℣": { tags: ["F℣"], color: "#FF6347" },
            "G4": { tags: ["G4"], color: "#4B0082" },
            "ARC": { tags: ["ΛꝚC"], color: "#20B2AA" },
            "L̴N̴D̴": { tags: ["L̴N̴D̴"], color: "#A9A9A9" },
            "ȻS": { tags: ["ȻS"], color: "#00F0DC" },
            "YΛ": { tags: ["YΛ"], color: "#FFFFE0" },
            "ŁS": { tags: ["ŁS"], color: "#FF1493" },
            "ᘖ࿐": { tags: ["ᘖ࿐"], color: "#87CEEB" },
            "₩ØȻ": { tags: ["₩ØȻ"], color: "#F00F03" },
            "ROW": { tags: ["RᴏW"], color: "#A6A6A6" },
            "LOV":  { tags: ["LⓄV"], color: "#FFC0CB" },
            "TDR": { tags: ["ƬDЯ", "TDR"], color: "#FFF000" },
            //"SOLO": { tags: ["ՖՕʟ☪"], color: "grey" },
          };
      
        let modeText;
        let modeIcon;
        if (system.unlisted) {
            modeIcon = Translation.modeIcons["custom"];
            if (system.mode === "modding") {
                modeText = "Custom Game";
            } else {
                modeText = `Custom Game - ${Translation.modes[system.mode]}`;
            }
        } else {
            modeIcon = Translation.modeIcons[system.mode];
            modeText = system.mode === "modding" ? `${Translation.modes[system.mode]} - ${Translation.mods[system.mod_id]}` : Translation.modes[system.mode];
        }
    
        let playerInfo = this.playerInfoBySystemId[`${system.id}@${system.address}`];
    
        let tagsHtml = '';
        if (playerInfo && playerInfo.data && playerInfo.data.players) {
            // Traiter les données des joueurs pour obtenir les tags et les comptes
            let playerList = [];
            for (let player of Object.values(playerInfo.data.players)) {
                playerList.push(player.player_name);
            }
    
            // Initialiser les objets de regroupement
            let clanToCount = {};
            for (let clanName in clans) {
                clanToCount[clanName] = 0;
            }
    
            // Parcourir les noms des joueurs pour les regrouper par clan
            for (let playerName of playerList) {
                let foundClan = null;
                for (let clanName in clans) {
                    let clan = clans[clanName];
                    for (let tag of clan.tags) {
                        if (playerName.includes(tag)) {
                            foundClan = clanName;
                            break;
                        }
                    }
                    if (foundClan) {
                        break;
                    }
                }
                if (foundClan) {
                    clanToCount[foundClan]++;
                }
            }
    
            // Construire le HTML des tags avec les comptes
            let tagsArray = [];
            for (let clanName in clanToCount) {
                let count = clanToCount[clanName];
                if (count > 0) {
                    let color = clans[clanName].color;
                    tagsArray.push(`<span style="color: ${color}; font-weight: bold;">${clanName} (${count})</span>`);
                }
            }
    
            if (tagsArray.length > 0) {
                tagsHtml = `<div>${tagsArray.join(', ')}</div>`;
            }
        }
    
        return `
            <div class="card-body">
                <h3 class="mb-0">${system.name} <span class="float-end">${Math.floor(system.time/60)} min</span></h3>
                <span>${modeIcon} ${modeText} <span class="float-end">${system.players} players</span></span>
                ${tagsHtml}
            </div>
        `;
    }
    

    _tick() {
        const self = this;

        let systems = self.systemListProvider.getSystems(self.preferencesManager.preferences);

        let currentIds = new Set();

        for (let system of systems) {
            currentIds.add(system.id.toString());
            self.systemsById[system.id.toString()] = system;

            if (self.systemCards.hasOwnProperty(system.id.toString())) {
                // If system is already on the list, update its info

                if (self.systemCards[system.id.toString()]) self.systemCards[system.id.toString()].innerHTML = self.getCardHTML(system);
            } else if (!self.systemCards.hasOwnProperty(system.id.toString())) {
                // If system isn't on the list, create a new card for it

                let card = document.createElement("div");
                card.classList.add("card");
                card.classList.add("system-list-item");
                card.classList.add("mb-3");

                card.innerHTML = self.getCardHTML(system);
                card.dataset.system = system.id;

                card.onmousedown = () => {
                    self.systemReportManager.showInfo(() => {
                        return self.systemsById[system.id.toString()];
                    });
                }

                card.onmouseover = () => {
                    // Pre-render and pre-fetch player list to make it "appear" quicker


                    self.fetchPlayerInfo(system);

                    // self.systemReportManager.prefetch(() => {
                    //     return self.systemsById[system.id.toString()];
                    // });
                }

                self.systemListElement.prepend(card);

                self.systemCards[system.id.toString()] = card;

                /* Notify of new system if user has it enabled */
                if (document.getElementById("newServerAlert").checked) {
                    (async() => {
                        let permission = Notification.permission;
                        if (["denied", "default"].includes(permission)) {
                            return;
                        }
                        let notification = new Notification('New Server Alert!');
                        document.addEventListener('visibilitychange', function() {
                            if (document.visibilityState === 'visible') {
                                notification.close();
                            }
                        });
                    })().then();
                    let permission = Notification.permission;
                    if (permission === "denied" || permission === "default") {
                        Notification.requestPermission().then();
                    }
                }
            }
        }

        for (let card of self.systemListElement.children) {
            if (!currentIds.has(card.dataset.system)) {
                card.remove();
                delete self.systemCards[card.dataset.system];
            }
        }

        // For some reason, self.systemListElement.children sometimes doesn't include all the cards
        for (let [id, card] of Object.entries(self.systemCards)) {
            if (!currentIds.has(id)) {
                card.remove();
                delete self.systemCards[card.dataset.system];
            }
        }

        self._sort();

    }

    _sort() {
        const self = this;

        [...self.systemListElement.children].sort((a, b) => {
            return self.systemsById[a.dataset.system].time > self.systemsById[b.dataset.system].time ? 1 : -1;
        }).forEach(node=>self.systemListElement.appendChild(node));
    }
}