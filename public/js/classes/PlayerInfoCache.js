class PlayerInfoCache {
    constructor() {
        this.cache = {};
    }

    fetchPlayerInfo(system) {
        const self = this;
        let systemId = `${system.id}@${system.address}`;

        // Vérifier si les informations sont déjà en cache et récentes
        if (
            self.cache[systemId] &&
            Date.now() - self.cache[systemId].timestamp < 10000
        ) {
            // Déjà récupéré récemment
            return Promise.resolve(self.cache[systemId].data);
        }

        // Si une requête est déjà en cours pour ce système, retourner la promesse existante
        if (self.cache[systemId] && self.cache[systemId].inProgress) {
            return self.cache[systemId].promise;
        }

        // Créer une nouvelle promesse pour la requête en cours
        let promise = fetch(
            `${window.siteConfig["static-api-provider"]}status/${systemId}`
        )
            .then(async (response) => {
                let info = await response.json();
                self.cache[systemId] = {
                    data: info,
                    timestamp: Date.now(),
                    inProgress: false,
                };
                return info;
            })
            .catch((error) => {
                console.error(
                    `Erreur lors de la récupération des informations des joueurs pour le système ${systemId}:`,
                    error
                );
                self.cache[systemId].inProgress = false;
                throw error;
            });

        // Stocker l'état de la requête en cours
        self.cache[systemId] = {
            inProgress: true,
            promise: promise,
        };

        return promise;
    }
}


