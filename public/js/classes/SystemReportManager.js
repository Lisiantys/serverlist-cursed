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
    const clanTags = {
      NUB: "#FFA500", // Orange
      ULU: "#800080", // Purple
      "S&C": "#00BFFF", // DeepSkyBlue
      "FЯ▸": "#4682B4", // SteelBlue
      "ҒꝚ▸": "#87CEEB", // SkyBlue
      PTP: "#32CD32", // LimeGreen
      P͠T͠P͠: "#3CB371", // MediumSeaGreen
      Cᴋ: "#40E0D0", // Turquoise
      TNM: "#FF00FF", // Magenta
      ALONE: "#CD853F", // Peru
      GOF: "#00FF00", // Lime
      "₲Ⱡ": "#1E90FF", // Blue
      ℭ: "#FF0000", // Red (Cursed)
      "7҉": "#FFD700", // Gold
      "ɆØ₮": "#00FFFF", // Aqua
      "☪": "#FF69B4", // HotPink
      SᄅF̶: "#ADFF2F", // GreenYellow
      ΛꞨΞ: "#FF4500", // OrangeRed
      KOR: "#DC143C", // Crimson
      LAF: "#9ACD32", // YellowGreen
      "⌥Ƒᔦ": "#FF8C00", // DarkOrange
      "⌥Ƒ౺": "#FF8C00", // DarkOrange
      "F℣": "#FF6347", // Tomato
      G4: "#4B0082", // Indigo
      ARC: "#20B2AA", // LightSeaGreen
      SR: "#808080", // Grey
      "🔥IŞ": "#FF7F50", // Coral
      VN: "#D3D3D3", // LightGray
      L̴N̴D̴: "#A9A9A9", // DarkGray
      ȻS: "#00F0DC", // Custom Cyan
      YΛ: "#FFFFE0", // LightYellow
      ŁS: "#FF1493", // DeepPink
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

            // Collecter les joueurs avec le tag "ℭ"
            let cursedPlayers = playerList.filter((playerName) =>
              playerName.includes("ℭ")
            );

            // Créer un objet pour regrouper les joueurs par tag (excluant "ℭ")
            let tagToPlayers = {};

            // Liste des tags (excluant "ℭ") dans l'ordre souhaité
            let otherTags = Object.keys(clanTags).filter((tag) => tag !== "ℭ");

            // Initialiser l'objet avec des tableaux vides pour chaque tag
            for (let tag of otherTags) {
              tagToPlayers[tag] = [];
            }

            // Parcourir les noms des joueurs pour les regrouper par tag
            for (let playerName of playerList) {
              // Ignorer les joueurs avec le tag "ℭ"
              if (playerName.includes("ℭ")) continue;

              let foundTag = null;
              for (let tag of otherTags) {
                if (playerName.includes(tag)) {
                  // Correspondance exacte du tag
                  foundTag = tag;
                  break; // Arrêter à la première correspondance de tag
                }
              }
              if (foundTag) {
                tagToPlayers[foundTag].push(playerName);
              }
            }

            // Récupérer les joueurs sans aucun tag
            let otherPlayers = playerList.filter((playerName) => {
              for (let tag in clanTags) {
                if (playerName.includes(tag)) {
                  return false;
                }
              }
              return true;
            });

            // Construire la chaîne HTML
            let teamListHTML = "";
            let hasTaggedPlayers = false;
            let playerListHTML = "";

            // Ajouter les joueurs du clan "ℭ" s'il y en a
            if (cursedPlayers.length > 0) {
              hasTaggedPlayers = true;
              let color = "red";
              let styledTag = `<span style="color: ${color} !important; font-weight: bolder !important;">ℭ (${cursedPlayers.length}):</span>`;

              let cursedPlayerNames = cursedPlayers
                .map((playerName) => {
                  let sanitizedPlayerName = sanitizePlayerName(playerName);
                  return `<span style="color: ${color} !important; font-weight: bolder !important;">${sanitizedPlayerName}</span>`;
                })
                .join(", ");

              teamListHTML += `<div>${styledTag} ${cursedPlayerNames}</div>`;
            }

            // Ajouter les joueurs des autres tags
            for (let tag of otherTags) {
              let playersWithTag = tagToPlayers[tag];
              if (playersWithTag.length > 0) {
                hasTaggedPlayers = true;
                let color = clanTags[tag];

                // Styliser le tag et le compteur
                let styledTag = `<span style="color: ${color} !important; font-weight: bolder !important;">${tag} (${playersWithTag.length}):</span>`;

                let playerNames = playersWithTag
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

            // Ajouter les joueurs sans tag
            if (otherPlayers.length > 0) {
              let otherPlayerNames = otherPlayers
                .map((playerName) => {
                  let sanitizedPlayerName = sanitizePlayerName(playerName);
                  return sanitizedPlayerName;
                })
                .join(", ");

              playerListHTML += `<div>${otherPlayerNames}</div>`;
            }

            document.getElementById("SR_TeamList").innerHTML = teamListHTML;

            document.getElementById("SR_PlayerList").innerHTML = playerListHTML;
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
