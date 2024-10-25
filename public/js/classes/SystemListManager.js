class SystemListManager {
    constructor(preferencesManager, systemListProvider, systemReportManager, playerInfoCache) {
        const self = this;

        self.preferencesManager = preferencesManager;
        self.systemListProvider = systemListProvider;
        self.systemReportManager = systemReportManager;

        self.systemCards = {};
        self.systemsById = {};
        self.systemListElement = document.getElementById("systemsList");

        //Récupération joueurs pour afficher tag + count sur chaque card/systeme
        self.playerInfoCache = playerInfoCache;
    }

    getAllSystems() {
        return Object.values(this.systemsById);
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
    
        let playerInfo = this.playerInfoCache.cache[`${system.id}@${system.address}`];

        let tagsHtml = '';
        if (playerInfo && playerInfo.data && playerInfo.data.players) {
            // Traiter les données des joueurs pour obtenir les tags et les comptes
            let playerList = [];
            for (let player of Object.values(playerInfo.data.players)) {
                playerList.push(player.player_name);
            }

            // Utiliser la fonction groupPlayersByClan pour regrouper les joueurs
            const { clanToPlayers, otherPlayers } = groupPlayersByClan(playerList, clans);

            // Construire le HTML des tags avec les comptes
            let tagsArray = [];
            for (let clanName in clanToPlayers) {
                let count = clanToPlayers[clanName].length;
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

            // Fetch player info for the system
            self.playerInfoCache.fetchPlayerInfo(system).then((info) => {
                // Update the card if it exists
                if (self.systemCards[system.id.toString()]) {
                    self.systemCards[system.id.toString()].innerHTML = self.getCardHTML(system);
                }
            }).catch((error) => {
                console.error(`Erreur lors de la récupération des informations des joueurs pour le système ${system.id}@${system.address}:`, error);
            });

            if (self.systemCards.hasOwnProperty(system.id.toString())) {
                // Mise à jour de la carte existante
                if (self.systemCards[system.id.toString()]) self.systemCards[system.id.toString()].innerHTML = self.getCardHTML(system);
            } else {
                // Création d'une nouvelle carte pour le système
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

                self.systemListElement.prepend(card);

                self.systemCards[system.id.toString()] = card;

                /* Notification pour un nouveau système si l'utilisateur l'a activé */
                if (document.getElementById("newServerAlert").checked) {
                    (async () => {
                        let permission = Notification.permission;
                        if (["denied", "default"].includes(permission)) {
                            return;
                        }
                        let notification = new Notification('New Server Alert!');
                        document.addEventListener('visibilitychange', function () {
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

        // Parfois, self.systemListElement.children n'inclut pas toutes les cartes
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
        }).forEach(node => self.systemListElement.appendChild(node));
    }
}