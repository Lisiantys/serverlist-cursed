class SystemReportManager {
  constructor(preferencesManager) {
    const self = this;

    self.preferencesManager = preferencesManager;

    self.prefetchedInfo = {};
  }

  prefetch(systemFetcher) {
    const self = this;

    let system = systemFetcher();

    let maybePrefetchedInfo =
      self.prefetchedInfo[`${system.id}@${system.address}`];
    if (
      !maybePrefetchedInfo ||
      (!maybePrefetchedInfo.inProgress &&
        Date.now() - maybePrefetchedInfo.timestamp > 10000)
    ) {
      self.prefetchedInfo[`${system.id}@${system.address}`] = {
        inProgress: true,
        timestamp: 0,
        data: new Promise(async (resolve) => {
          fetch(
            `${window.siteConfig["static-api-provider"]}status/${system.id}@${system.address}`
          ).then(async (response) => {
            let info = await response.json();
            self.prefetchedInfo[
              `${system.id}@${system.address}`
            ].inProgress = false;
            self.prefetchedInfo[`${system.id}@${system.address}`].timestamp =
              Date.now();
            resolve(info);
          });
        }),
      };
    }
  }

  showInfo(systemFetcher) {

    const clans = {
      "GOF": {
        tags: ["GOF", "ɢᴏҒ"],
        color: "#00FF00", // Lime
      },
      "FЯ": {
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
        tags: ["⌥Ƒᔦ", "⌥Ƒ౺"],
        color: "#FF8C00", // DarkOrange
      },
      "PTP": {
        tags: ["PTP", "P͠T͠P͠"],
        color: "#32CD32",
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
      "ΛꞚC": { tags: ["ΛꞚC"], color: "#20B2AA" },
      "SR": { tags: ["SR"], color: "#808080" },
      "L̴N̴D̴": { tags: ["L̴N̴D̴"], color: "#A9A9A9" },
      "ȻS": { tags: ["ȻS"], color: "#00F0DC" },
      "YΛ": { tags: ["YΛ"], color: "#FFFFE0" },
      "ŁS": { tags: ["ŁS"], color: "#FF1493" },
      "ᘖ࿐": { tags: ["ᘖ࿐"], color: "#87CEEB" },
      "₩ØȻ": { tags: ["₩ØȻ"], color: "#F00F03" },
      "ROW": { tags: ["RᴏW"], color: "#A6A6A6" },
    };

    const self = this;

    let system = systemFetcher();

    document.getElementById("SR_Name").innerText = system.name;
    document.getElementById("SR_Time").innerText = `${Math.floor(
      system.time / 60
    )} min`;

    document.getElementById("SR_PlayerCount").innerText = system.players;

    let systemURL = self.preferencesManager.preferences.copyFullLinks
      ? `https://starblast.io/#${system.id}@${system.address}`
      : `https://starblast.io/#${system.id}`;
    if (system.unlisted)
      systemURL = `https://starblast.io/#${system.id}@${system.address}`;

    document.getElementById("systemCopyLink").onclick = () => {
      self._copyText(systemURL);
      document.getElementById("clipboard").className = "bi bi-clipboard-check";
      setTimeout(() => {
        document.getElementById("clipboard").className = "bi bi-clipboard";
      }, 500);
    };

    document.getElementById("systemReportLink").setAttribute("href", systemURL);

    document.getElementById("systemReport").style.display = "";

    system.mod_id = system.mod_id ?? "";

    // Check if system mode supports live view

    document.getElementById("systemSpectateButton").style.display = "none";
    if (window.siteConfig.mode === "live" && system.mode !== "invasion") {
      if (window.activeSpectator !== undefined)
        window.activeSpectator.destroy();
      window.activeSpectator = new Spectator(`${system.id}@${system.address}`);

      document
        .getElementById("systemReportLink")
        .classList.remove("rounded-end");

      document.getElementById("systemSpectateButton").onclick = () => {
        if (!window.activeSpectator || window.activeSpectator.destroyed)
          window.activeSpectator = new Spectator(
            `${system.id}@${system.address}`
          );
        Spectator.show();
      };

      // show supported static api div
      document.getElementById("SR_StaticAPIRequired").style.display = "";
      document.getElementById("SR_TeamModeRequired").style.display = "none";
      // Reset values
      document.getElementById("SR_ECPCount").innerText = "";
      document.getElementById("SR_TotalTeamScores").innerText = "";
      document.getElementById("SR_PlayerList").innerHTML = "";
      document.getElementById("SR_TeamList").innerHTML = "";

      // async fetch game info from static api
      if (!self.prefetchedInfo[`${system.id}@${system.address}`])
        self.prefetch(systemFetcher);

      self.prefetchedInfo[`${system.id}@${system.address}`].data.then(
        (info) => {
          //let info = await response.json();
          if (info && info.players) {
            let playerList = [];
            let ecpCount = 0;
            for (let player of Object.values(info.players)) {
              playerList.push(player.player_name);
              if (player.custom) ecpCount++;
            }

            if (
              info.api &&
              info.api.type === "rich" &&
              (info.mode.id === "team" ||
                (info.mode.id === "modding" && info.mode.root_mode === "team"))
            ) {
              let teamScoreCount = [];
              let teamECPCount = [];
              for (let team of info.mode.teams) {
                teamECPCount.push(`${team.ecpCount} ${team.color}`);
                teamScoreCount.push(
                  `${Math.floor(team.totalScore / 1000)}k ${team.color}`
                );
              }

              document.getElementById("SR_TeamModeRequired").style.display = "";
              document.getElementById("SR_TotalTeamScores").innerText =
                teamScoreCount.join(", ");
              document.getElementById("SR_ECPCount").innerText =
                teamECPCount.join(", ");

              document.getElementById("systemSpectateButton").style.display =
                "";
            } else {
              document.getElementById("SR_ECPCount").innerText =
                String(ecpCount);
            }

           // Fonction pour échapper les caractères spéciaux
           function sanitizePlayerName(playerName) {
            return playerName
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\u202E/g, "");
        }

        // Initialiser les objets de regroupement
        let clanToPlayers = {};
        for (let clanName in clans) {
            clanToPlayers[clanName] = [];
        }

        let otherPlayers = [];

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
                clanToPlayers[foundClan].push(playerName);
            } else {
                otherPlayers.push(playerName);
            }
        }

        // Construire la chaîne HTML pour les Teams
        let teamListHTML = '';
        let hasTaggedPlayers = false;

        // Liste des clans dans l'ordre souhaité
        let clanNames = [
            "ℭ", "GOF", "NUB", "ƲԼƲ", "S&C", "FЯ", "PTP", "P͠T͠P͠", "Cᴋ",
            "ƬƝⱮ", "ALONE", "₲Ⱡ", "7҉", "ɆØ₮", "☪", "SᄅF̶", "ΛꞨΞ",
            "KOR", "Ⱡ₳₣", "⌥Ƒ", "F℣", "G4", "ΛꞚC", "SR", "🔥IŞ", "VN",
            "L̴N̴D̴", "ȻS", "YΛ", "ŁS", "ᘖ࿐", "₩ØȻ", "ROW"
            // Ajoutez les autres clans si nécessaire
        ];

        for (let clanName of clanNames) {
            let playersWithClan = clanToPlayers[clanName];
            if (playersWithClan && playersWithClan.length > 0) {
                hasTaggedPlayers = true;
                let color = clans[clanName].color;
                let styledTag = `<span style="color: ${color} !important; font-weight: bolder !important;">${clanName} (${playersWithClan.length}):</span>`;

                let playerNames = playersWithClan
                    .map((playerName) => {
                        let sanitizedPlayerName = sanitizePlayerName(playerName);
                        return `<span style="color: ${color} !important; font-weight: bolder !important;">${sanitizedPlayerName}</span>`;
                    })
                    .join(", ");

                teamListHTML += `<div>${styledTag} ${playerNames}</div>`;
            }
        }

        // Mettre à jour la section Teams
        document.getElementById("SR_TeamList").innerHTML = teamListHTML;

        // Afficher ou masquer la section Teams
        if (hasTaggedPlayers) {
            document.getElementById("SR_TeamsSection").style.display = "";
        } else {
            document.getElementById("SR_TeamsSection").style.display = "none";
        }

        // Construire la chaîne HTML pour les joueurs sans tag
        let playerListHTML = '';
        if (otherPlayers.length > 0) {
            let otherPlayerNames = otherPlayers
                .map((playerName) => {
                    let sanitizedPlayerName = sanitizePlayerName(playerName);
                    return sanitizedPlayerName;
                })
                .join(", ");

            playerListHTML += `<div>${otherPlayerNames}</div>`;
        }

        // Mettre à jour la section Players
        document.getElementById("SR_PlayerList").innerHTML = playerListHTML;

        // Mettre à jour le compteur de joueurs sans tags
        document.getElementById("SR_PlayerCount").innerText = otherPlayers.length;
}
        }
      );
    } else {
      document.getElementById("SR_StaticAPIRequired").style.display = "none";
      document.getElementById("systemSpectateButton").style.display = "none";
      document.getElementById("systemReportLink").classList.add("rounded-end");
    }
  }

  _copyText(text) {
    if (!navigator.clipboard) {
      let textArea = document.createElement("textarea");
      textArea.value = text;

      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      document.execCommand("copy");

      document.body.removeChild(textArea);
      return;
    }
    navigator.clipboard.writeText(text).then();
  }
}
