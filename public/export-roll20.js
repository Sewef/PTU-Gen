/**
 * Export utilities for Roll20 format
 * Converts Pokémon data to Roll20 character sheet format
 * Uses EXP_TABLE from export.js
 */

/**
 * Get EXP for a given level
 * @param {number} level - The Pokémon level
 * @returns {Object} { exp: current level exp, exp_max: next level exp }
 */
function getExpForLevel(level) {
    const currentLevelData = EXP_TABLE.find(entry => entry.lvl === level);
    const nextLevelData = EXP_TABLE.find(entry => entry.lvl === level + 1);
    
    return {
        exp: currentLevelData?.exp || 0,
        exp_max: nextLevelData?.exp || currentLevelData?.exp || 0
    };
}

/**
 * Convert Pokémon data to Roll20 format
 * @param {Object} pokemon - The Pokémon object to convert
 * @returns {Object} Roll20 formatted data
 */
function convertToRoll20Format(pokemon) {
    // Get EXP for current level
    const expData = getExpForLevel(pokemon.level || 1);
    
    // Map stats to Roll20 format
    const roll20Data = {
        CharType: 0, // 0 for Pokémon
        nickname: pokemon.nickname || "",
        species: pokemon.name || "",
        type1: getType(pokemon, 0),
        type2: getType(pokemon, 1),
        Level: pokemon.level || 1,
        EXP: expData.exp,
        EXP_max: expData.exp_max,
        HeldItem: "", // Not tracked in current format
        Gender: pokemon.gender || "Male",
        Nature: pokemon.nature?.name || "Hardy",
        Height: pokemon.otherInfo?.sizeCategory || "",
        WeightClass: pokemon.otherInfo?.weightClass || 0,
        
        // Base stats (from baseStats)
        base_HP: pokemon.baseStats?.HP || 0,
        base_ATK: pokemon.baseStats?.Attack || 0,
        base_DEF: pokemon.baseStats?.Defense || 0,
        base_SPATK: pokemon.baseStats?.["Special Attack"] || 0,
        base_SPDEF: pokemon.baseStats?.["Special Defense"] || 0,
        base_SPEED: pokemon.baseStats?.Speed || 0,
        
        // Current stats (from stats)
        HP: calculateLevelPoints(pokemon, 'HP'),
        ATK: calculateLevelPoints(pokemon, 'atk'),
        DEF: calculateLevelPoints(pokemon, 'def'),
        SPATK: calculateLevelPoints(pokemon, 'spA'),
        SPDEF: calculateLevelPoints(pokemon, 'spD'),
        SPEED: calculateLevelPoints(pokemon, 'spe'),
        
        // Capabilities
        Capabilities: convertCapabilities(pokemon.capabilities || {}),
        
        // Skills - extract from pokemon.skills (Xd6+Y format)
        ...convertSkills(pokemon.skills || {}),
        
        TutorPoints: Math.floor(pokemon.level / 5) + 1,
        TutorPoints_max: Math.floor(pokemon.level / 5) + 1,
        
        // Struggle move (default)
        Struggle_Type: "Normal",
        Struggle_DType: "Physical",
        Struggle_DB: 4,
        Struggle_AC: 4,
        Struggle_Range: "Melee, 1 Target",
        
        // Flags for special abilities

    };
    
    // Add moves (up to 8 moves)
    const moves = pokemon.moves || [];
    moves.forEach((move, index) => {
        if (index < 8) {
            const moveKey = index === 0 ? 'Move1' : 
                           index === 1 ? 'Move2' : 
                           index === 2 ? 'Move3' : 
                           index === 3 ? 'Move4' : 
                           index === 4 ? 'Move5' : 
                           index === 5 ? 'Move6' : 
                           index === 6 ? 'Move7' : 'Move8';
            
            roll20Data[moveKey] = convertMove(move);
        }
    });
    
    // Add abilities
    const abilities = pokemon.abilities || [];
    abilities.forEach((ability, index) => {
        const abilityKey = `Ability${index + 1}`;
        roll20Data[abilityKey] = convertAbility(ability);
    });
    
    // Check for specific abilities and set flags
    // abilities.forEach(ability => {
    //     const abilityName = ability.name?.toLowerCase() || '';
    //     if (abilityName === 'sniper') roll20Data.sniper = 1;
    //     if (abilityName === 'hustle') roll20Data.hustle = 1;
    //     if (abilityName === 'flash fire') roll20Data.flashfire = 1;
    //     if (abilityName === 'damp') roll20Data.damp = 1;
    // });
    
    return roll20Data;
}

/**
 * Get type at specific index
 */
function getType(pokemon, index) {
    let types = pokemon.actualTypes || pokemon.types || [];
    
    // Handle forme variants
    if (types.isFormeVariant && types.selectedForme) {
        types = types.formes[types.selectedForme] || [];
    }
    
    return types[index] || "";
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
 * Convert capabilities to Roll20 format
 * Handles different capability formats:
 * - "Overland 6" -> { Overland: 6 }
 * - "Underdog" -> { Underdog: true }
 * - "Jump 1/2" -> { HJ: 1, LJ: 2 }
 * - "Naturewalk(Forest)" -> { "Naturewalk(Forest)": true }
 */
function convertCapabilities(capabilities) {
    const roll20Caps = {};
    
    if (!Array.isArray(capabilities)) {
        return roll20Caps;
    }
    
    capabilities.forEach(cap => {
        if (typeof cap !== 'string') return;
        
        // Special case: Jump X/Y
        const jumpMatch = cap.match(/^Jump\s+(\d+)\/(\d+)$/i);
        if (jumpMatch) {
            roll20Caps.HJ = parseInt(jumpMatch[1]);
            roll20Caps.LJ = parseInt(jumpMatch[2]);
            return;
        }
        
        // Case: "Capability Value" (e.g., "Overland 6")
        const withValueMatch = cap.match(/^([^\d]+?)\s+(\d+)$/);
        if (withValueMatch) {
            const capName = withValueMatch[1].trim();
            const capValue = parseInt(withValueMatch[2]);
            roll20Caps[capName] = capValue;
            return;
        }
        
        // Case: Simple capability name (e.g., "Underdog", "Naturewalk(Forest)")
        const capName = cap.trim();
        if (capName) {
            roll20Caps[capName] = true;
        }
    });
    
    return roll20Caps;
}

/**
 * Convert skills to Roll20 format
 * Skills are in format "Xd6+Y" where X is the skill rank and Y is the bonus
 */
function convertSkills(skills) {
    // Mapping from input skill names to Roll20 skill names
    const skillNameMapping = {
        'Acrobatics': 'Acrobatics',
        'Athletics': 'Athletics',
        'Combat': 'Combat',
        'Intimidate': 'Intimidate',
        'Stealth': 'Stealth',
        'Survival': 'Survival',
        'General Edu': 'GeneralEducation',
        'Medicine Edu': 'MedicineEducation',
        'Occult Edu': 'OccultEducation',
        'Pokémon Edu': 'PokemonEducation',
        'Tech Edu': 'TechnologyEducation',
        'Guile': 'Guile',
        'Perception': 'Perception',
        'Charm': 'Charm',
        'Command': 'Command',
        'Focus': 'Focus',
        'Intuition': 'Intuition'
    };
    
    // Default skills list for Roll20
    const skillDefaults = {
        Acrobatics: { rank: 1, bonus: 0 },
        Athletics: { rank: 1, bonus: 0 },
        Combat: { rank: 1, bonus: 0 },
        Intimidate: { rank: 1, bonus: 0 },
        Stealth: { rank: 1, bonus: 0 },
        Survival: { rank: 1, bonus: 0 },
        GeneralEducation: { rank: 1, bonus: 0 },
        MedicineEducation: { rank: 1, bonus: 0 },
        OccultEducation: { rank: 1, bonus: 0 },
        PokemonEducation: { rank: 1, bonus: 0 },
        TechnologyEducation: { rank: 1, bonus: 0 },
        Guile: { rank: 1, bonus: 0 },
        Perception: { rank: 1, bonus: 0 },
        Charm: { rank: 1, bonus: 0 },
        Command: { rank: 1, bonus: 0 },
        Focus: { rank: 1, bonus: 0 },
        Intuition: { rank: 1, bonus: 0 }
    };
    
    const roll20Skills = {};
    
    // Process each skill
    Object.keys(skillDefaults).forEach(roll20SkillName => {
        let rank = 1;
        let bonus = 0;
        
        // Check if skill exists in pokemon data (try both input format and Roll20 format)
        let skillValue = null;
        
        // First try to find by Roll20 name
        if (skills[roll20SkillName]) {
            skillValue = skills[roll20SkillName];
        } else {
            // Try to find by input name mapping
            for (const [inputName, mappedName] of Object.entries(skillNameMapping)) {
                if (mappedName === roll20SkillName && skills[inputName]) {
                    skillValue = skills[inputName];
                    break;
                }
            }
        }
        
        if (skillValue) {
            // Parse "Xd6+Y" format
            const match = skillValue.match(/^(\d+)d6\+(\d+)$/);
            if (match) {
                rank = parseInt(match[1]);
                bonus = parseInt(match[2]);
            } else {
                // Try to parse "Xd6" format (no bonus)
                const simpleMatch = skillValue.match(/^(\d+)d6$/);
                if (simpleMatch) {
                    rank = parseInt(simpleMatch[1]);
                    bonus = 0;
                }
            }
        }
        
        // Add skill rank and bonus to output
        roll20Skills[roll20SkillName] = rank;
        roll20Skills[`${roll20SkillName}_bonus`] = bonus;
    });
    
    return roll20Skills;
}


/**
 * Convert move to Roll20 format
 */
function convertMove(move) {
    const roll20Move = {
        Name: move.name || "",
        Type: move.type || "Normal",
        DType: move.class || "Physical",
        DB: extractDamageBase(move),
        Freq: move.frequency || "At-Will",
        AC: move.ac || "",
        Range: move.range || "",
        Effects: move.effect || ""
    };
    
    return roll20Move;
}

/**
 * Extract damage base from move
 */
function extractDamageBase(move) {
    if (move.damageBase) {
        // If damageBase object exists, extract the base damage
        if (typeof move.damageBase === 'object' && move.damageBase.dmg) {
            // Extract just the number from strings like "1d8+10"
            const match = move.damageBase.dmg.match(/\d+d\d+\+(\d+)/);
            if (match) {
                return parseInt(match[1]);
            }
            // Try to extract just a number
            const numMatch = move.damageBase.dmg.match(/\+(\d+)/);
            if (numMatch) {
                return parseInt(numMatch[1]);
            }
        }
    }
    
    // Try to extract from DB field directly
    if (move.db) {
        return move.db;
    }
    
    return "";
}

/**
 * Convert ability to Roll20 format
 */
function convertAbility(ability) {
    const roll20Ability = {
        Name: ability.name || "",
        Freq: ability.frequency || "Static",
        Info: buildAbilityInfo(ability)
    };
    
    return roll20Ability;
}

/**
 * Build ability info text
 */
function buildAbilityInfo(ability) {
    let info = "";
    
    if (ability.trigger) {
        info += `Trigger - ${ability.trigger}\n`;
    }
    
    if (ability.effect) {
        info += ability.effect;
    }
    
    if (ability.bonus) {
        if (info) info += "\n";
        info += ability.bonus;
    }
    
    if (ability.special) {
        if (info) info += "\n";
        info += ability.special;
    }
    
    if (ability.note) {
        if (info) info += "\n";
        info += `Note: ${ability.note}`;
    }
    
    return info;
}

/**
 * Export Pokémon as Roll20 format JSON
 * @param {Object} pokemon - The Pokémon object to export
 */
function exportPokemonRoll20(pokemon) {
    const roll20Data = convertToRoll20Format(pokemon);
    const dataStr = JSON.stringify(roll20Data, null, 4);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = pokemon.nickname 
        ? `${pokemon.nickname}_${pokemon.name}_Lvl${pokemon.level}_Roll20.json`
        : `${pokemon.name}_Lvl${pokemon.level}_Roll20.json`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
