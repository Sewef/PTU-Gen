/**
 * Export utilities for Pokésheets format
 * Converts Pokémon data to Pokésheets character sheet format
 */

/**
 * Convert Pokémon data to Pokésheets format
 * @param {Object} pokemon - The Pokémon object to convert
 * @returns {Object} Pokésheets formatted data
 */
function convertToPokesheetsFormat(pokemon) {
    // Debug: Check if learnsets exist
    console.log('Pokemon learnsets:', pokemon.learnsets);
    console.log('Has learnsets?', pokemon.learnsets != null);
    
    // Convert capabilities
    const capabilitiesResult = convertPokesheetsCapabilities(pokemon.capabilities || []);
    
    // Map stats to Pokésheets format
    const pokesheetsData = {
        pokemonDocumentId: generateUUID(),
        googleDriveFileId: null,
        googleDriveFolderId: "",
        fileName: "",
        
        pokedexEntry: {
            pokedexEntryDocumentId: generateUUID(),
            pokedexDocumentId: null,
            species: pokemon.name || "",
            form: "",
            types: getPokesheetsTypes(pokemon),
            legendary: pokemon.legendary || false,
            nationalDexNumber: null,
            regionOfOrigin: null,
            entryText: null,
            pokeApiId: null,
            imageFileUrl: `https://sewef.github.io/ptu/img/pokemon/full/${pokemon.id | 0}.png`,
            cryFileUrl: null,
            baseStats: {},
            size: pokemon.otherInfo?.sizeCategory || "Unknown",
            weight: `${pokemon.otherInfo?.weightClass || 0}`,
            genderless: pokemon.gender === "No Gender",
            malePercent: null,
            femalePercent: null,
            eggGroups: [],
            hatchRate: null,
            habitats: [],
            diets: [],
            moveLearnset: convertPokesheetsMoveLearns(pokemon.learnsets?.moveLearns || {}),
            abilityLearnset: convertPokesheetsAbilityLearns(pokemon.learnsets?.abilityLearns || {
                basicAbilities: [],
                advancedAbilities: [],
                highAbilities: []
            }),
            skills: convertPokesheetsSkills(pokemon.skills || {}),
            evolutionFamily: {
                familyName: null,
                entries: []
            },
            evolutionStage: null,
            evolutionsRemainingMale: null,
            evolutionsRemainingFemale: null,
            evolutionsRemainingGenderless: null,
            evolutionMinLevel: 0,
            evolutionAtLevel: 100,
            megaEvolution: null,
            levelUpMoves: {},
            basicAbilities: [],
            advancedAbilities: [],
            highAbilities: [],
            capabilities: capabilitiesResult.capabilities,
            otherCapabilities: capabilitiesResult.otherCapabilities
        },
        
        name: pokemon.name || "",
        level: pokemon.level || 1,
        exp: EXP_TABLE.find(e => e.lvl === pokemon.level)?.exp || 0,
        nature: pokemon.nature?.name || null,
        gender: pokemon.gender || null,
        shiny: pokemon.shiny || false,
        
        // Stats breakdown (base, level up, additions, CS, total)
        hp: {
            base: pokemon.baseStats?.HP || 0,
            lvlUp: calculateLevelPoints(pokemon, 'HP'),
            add: 0,
            cs: 0,
            sum: pokemon.stats?.HP || 0
        },
        atk: {
            base: pokemon.baseStats?.Attack || 0,
            lvlUp: calculateLevelPoints(pokemon, 'atk'),
            add: 0,
            cs: 0,
            sum: pokemon.stats?.atk || 0
        },
        def: {
            base: pokemon.baseStats?.Defense || 0,
            lvlUp: calculateLevelPoints(pokemon, 'def'),
            add: 0,
            cs: 0,
            sum: pokemon.stats?.def || 0
        },
        spatk: {
            base: pokemon.baseStats?.["Special Attack"] || 0,
            lvlUp: calculateLevelPoints(pokemon, 'spA'),
            add: 0,
            cs: 0,
            sum: pokemon.stats?.spA || 0
        },
        spdef: {
            base: pokemon.baseStats?.["Special Defense"] || 0,
            lvlUp: calculateLevelPoints(pokemon, 'spD'),
            add: 0,
            cs: 0,
            sum: pokemon.stats?.spD || 0
        },
        spd: {
            base: pokemon.baseStats?.Speed || 0,
            lvlUp: calculateLevelPoints(pokemon, 'spe'),
            add: 0,
            cs: 0,
            sum: pokemon.stats?.spe || 0
        },
        
        health: pokemon.hitPoints || 0,
        injuries: 0,
        thp: 0,
        dr: 0,
        afflictions: null,
        buffs: "",
        evasionPhysicalBonus: 0,
        evasionSpecialBonus: 0,
        evasionSpeedBonus: 0,
        heldItem: null,
        
        // Moves
        moves: convertPokesheetseMoves(pokemon.moves || []),
        
        // Abilities
        abilities: convertPokesheetsAbilities(pokemon.abilities || []),
        
        pokeEdges: [],
        tutorPoints: Math.floor(pokemon.level / 5) + 1,
        evolutionsRemaining: null,
        notes: []
    };
    
    return pokesheetsData;
}

/**
 * Generate a UUID v4
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get types for Pokésheets format
 */
function getPokesheetsTypes(pokemon) {
    let types = pokemon.actualTypes || pokemon.types || [];
    
    if (types.isFormeVariant && types.selectedForme) {
        types = types.formes[types.selectedForme] || [];
    }
    
    return Array.isArray(types) ? types : [types];
}

/**
 * Calculate level points (stat - base stat)
 */
function calculateLevelPoints(pokemon, statKey) {
    const finalStat = pokemon.stats?.[statKey] || 0;
    const baseStatMap = {
        'HP': 'HP',
        'atk': 'Attack',
        'def': 'Defense',
        'spA': 'Special Attack',
        'spD': 'Special Defense',
        'spe': 'Speed'
    };
    const baseStat = pokemon.baseStats?.[baseStatMap[statKey]] || 0;
    return Math.max(0, finalStat - baseStat);
}

/**
 * Convert skills to Pokésheets format (lowercase keys)
 */
function convertPokesheetsSkills(skills) {
    const pokesheetsSkills = {
        acrobatics: "",
        athletics: "",
        combat: "",
        intimidate: "",
        stealth: "",
        survival: "",
        "generalEdu": "",
        "medicineEdu": "",
        "occultEdu": "",
        "pokemonEdu": "",
        "techEdu": "",
        guile: "",
        perception: "",
        charm: "",
        command: "",
        focus: "",
        intuition: ""
    };
    
    // Map from input skill names to Pokésheets output keys
    const skillMapping = {
        'Acrobatics': 'acrobatics',
        'Athletics': 'athletics',
        'Combat': 'combat',
        'Intimidate': 'intimidate',
        'Stealth': 'stealth',
        'Survival': 'survival',
        'General Edu': 'generalEdu',
        'Medicine Edu': 'medicineEdu',
        'Occult Edu': 'occultEdu',
        'Pokémon Edu': 'pokemonEdu',
        'Tech Edu': 'techEdu',
        'Guile': 'guile',
        'Perception': 'perception',
        'Charm': 'charm',
        'Command': 'command',
        'Focus': 'focus',
        'Intuition': 'intuition'
    };
    
    // Process skills
    Object.entries(skills).forEach(([inputKey, value]) => {
        if (!value) return;
        
        // Find the mapped key
        let mappedKey = skillMapping[inputKey];
        if (!mappedKey) {
            // Try lowercase version
            const lowerKey = Object.keys(skillMapping).find(k => 
                k.toLowerCase() === inputKey.toLowerCase()
            );
            mappedKey = lowerKey ? skillMapping[lowerKey] : null;
        }
        
        if (mappedKey) {
            pokesheetsSkills[mappedKey] = value;
        }
    });
    
    return pokesheetsSkills;
}

/**
 * Convert capabilities to Pokésheets format
 */
function convertPokesheetsCapabilities(capabilities) {
    // Initialize with only the allowed capabilities as null
    const pokesheetsCapabilities = {
        "Overland": null,
        "Swim": null,
        "Sky": null,
        "Levitate": null,
        "Burrow": null,
        "High Jump": null,
        "Long Jump": null,
        "Power": null
    };
    
    const otherCapabilities = [];
    
    if (!Array.isArray(capabilities)) {
        return { capabilities: pokesheetsCapabilities, otherCapabilities: "" };
    }
    
    const allowedCapabilities = ["Overland", "Swim", "Sky", "Levitate", "Burrow", "High Jump", "Long Jump", "Power"];
    
    capabilities.forEach(cap => {
        if (typeof cap !== 'string') return;
        
        // Special case: Jump X/Y
        const jumpMatch = cap.match(/^Jump\s+(\d+)\/(\d+)$/i);
        if (jumpMatch) {
            pokesheetsCapabilities["High Jump"] = parseInt(jumpMatch[1]);
            pokesheetsCapabilities["Long Jump"] = parseInt(jumpMatch[2]);
            return;
        }
        
        // Case: "Capability Value" (e.g., "Overland 6")
        const withValueMatch = cap.match(/^([^\d]+?)\s+(\d+)$/);
        if (withValueMatch) {
            const capName = withValueMatch[1].trim();
            const capValue = parseInt(withValueMatch[2]);
            
            // Check if it's an allowed capability
            if (allowedCapabilities.includes(capName)) {
                pokesheetsCapabilities[capName] = capValue;
            } else {
                // Everything else: add to capabilities with -1, and to otherCapabilities with value
                pokesheetsCapabilities[capName] = -1;
                otherCapabilities.push(`${capName} ${capValue}`);
            }
            return;
        }
        
        // Case: Simple capability name (no numeric value)
        const capName = cap.trim();
        if (capName) {
            // Check if it's an allowed capability
            if (allowedCapabilities.includes(capName)) {
                pokesheetsCapabilities[capName] = 0;
            } else {
                // All other capabilities: add to capabilities with -1, and to otherCapabilities
                pokesheetsCapabilities[capName] = -1;
                otherCapabilities.push(capName);
            }
        }
    });
    
    return { 
        capabilities: pokesheetsCapabilities, 
        otherCapabilities: otherCapabilities.join(", ") 
    };
}

/**
 * Convert moves to Pokésheets format
 */
function convertPokesheetseMoves(moves) {
    return moves.map(move => ({
        name: move.name || "",
        type: move.type || "Normal",
        stab: false, // Not tracked in current format
        frequency: move.frequency || "At-Will",
        accuracyCheck: extractAccuracy(move),
        damageBase: extractDamageBase(move),
        damageClass: move.class || "Physical",
        range: move.range || "",
        effects: move.effect || "",
        contestType: "",
        contestEffect: "",
        critsOn: ""
    }));
}

/**
 * Extract accuracy from move
 */
function extractAccuracy(move) {
    if (move.ac) {
        // Convert to number if it's a string
        const ac = typeof move.ac === 'string' ? parseInt(move.ac) : move.ac;
        return isNaN(ac) ? null : ac;
    }
    // Try to parse AC from range
    if (move.range && move.range.includes("AC")) {
        const match = move.range.match(/AC[:\s]+(\d+)/);
        if (match) return parseInt(match[1]);
    }
    return null;
}

/**
 * Convert move learnset to Pokésheets format
 */
function convertPokesheetsMoveLearns(moveLearns) {
    const result = {
        levelUpMoves: [],
        machineMoves: [],
        eggMoves: [],
        tutorMoves: [],
        homebrewMoves: []
    };
    
    if (!moveLearns) return result;
    
    // Extract level-up moves
    if (moveLearns['Level Up Move List'] && Array.isArray(moveLearns['Level Up Move List'])) {
        result.levelUpMoves = moveLearns['Level Up Move List'].map(move => ({
            moveName: move.Move || "",
            learnedLevel: move.Level || 0
        }));
    }
    
    // Extract machine moves (simple array of move names)
    if (moveLearns['TM/HM Move List'] && Array.isArray(moveLearns['TM/HM Move List'])) {
        result.machineMoves = moveLearns['TM/HM Move List'].map(move => move.Move || move);
    } else if (moveLearns['TM/Tutor Moves List'] && Array.isArray(moveLearns['TM/Tutor Moves List'])) {
        result.machineMoves = moveLearns['TM/Tutor Moves List'].map(move => move.Move || move);
    }
    
    // Extract egg moves (simple array of move names)
    if (moveLearns['Egg Move List'] && Array.isArray(moveLearns['Egg Move List'])) {
        result.eggMoves = moveLearns['Egg Move List'].map(move => move.Move || move);
    }
    
    // Extract tutor moves (simple array of move names)
    if (moveLearns['Tutor Move List'] && Array.isArray(moveLearns['Tutor Move List'])) {
        result.tutorMoves = moveLearns['Tutor Move List'].map(move => move.Move || move);
    }
    
    // Extract homebrew moves
    if (moveLearns['Homebrew Move List'] && Array.isArray(moveLearns['Homebrew Move List'])) {
        result.homebrewMoves = moveLearns['Homebrew Move List'].map(move => move.Move || move);
    }
    
    return result;
}

/**
 * Convert ability learnset to Pokésheets format with full ability details
 */
function convertPokesheetsAbilityLearns(abilityLearns) {
    const result = {
        basicAbilities: [],
        advancedAbilities: [],
        highAbilities: []
    };
    
    if (!abilityLearns) return result;
    
    // Helper function to flatten ability options (handles arrays within arrays)
    const flattenAbilities = (abilities) => {
        if (!Array.isArray(abilities)) return [];
        const flattened = [];
        
        abilities.forEach(ability => {
            if (Array.isArray(ability)) {
                // If ability is an array of choices, add all choices
                flattened.push(...ability);
            } else if (ability && ability !== null) {
                // If single ability object, add it
                flattened.push(ability);
            }
        });
        
        return flattened;
    };
    
    // Process abilities - they should already have full details from the server
    result.basicAbilities = flattenAbilities(abilityLearns.basicAbilities || []);
    result.advancedAbilities = flattenAbilities(abilityLearns.advancedAbilities || []);
    result.highAbilities = flattenAbilities(abilityLearns.highAbilities || []);
    
    return result;
}

/**
 * Extract damage base from move
 */
function extractDamageBase(move) {
    if (move.damageBase) {
        if (typeof move.damageBase === 'object' && move.damageBase.dmg) {
            const match = move.damageBase.dmg.match(/\d+d\d+\+(\d+)/);
            if (match) return parseInt(match[1]);
        } else if (typeof move.damageBase === 'number') {
            return move.damageBase;
        }
    }
    return null;
}

/**
 * Convert abilities to Pokésheets format
 */
function convertPokesheetsAbilities(abilities) {
    return abilities.map(ability => ({
        name: ability.name || "",
        effect: ability.effect || "",
        trigger: ability.trigger || "",
        target: ability.target || "",
        frequency: ability.frequency || "Static"
    }));
}

/**
 * Export Pokémon as Pokésheets format JSON
 * @param {Object} pokemon - The Pokémon object to export
 */
function exportPokemonPokesheets(pokemon) {
    const pokesheetsData = convertToPokesheetsFormat(pokemon);
    const dataStr = JSON.stringify(pokesheetsData, null, 4);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = pokemon.nickname 
        ? `${pokemon.nickname}_${pokemon.name}_Lvl${pokemon.level}_Pokesheets.json`
        : `${pokemon.name}_Lvl${pokemon.level}_Pokesheets.json`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
