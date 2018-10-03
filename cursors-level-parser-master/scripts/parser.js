(function(w) {

    const levelNameInput    = document.getElementById('levelNameInput');
    const inputArea         = document.getElementById('inputArea');
    const outputArea        = document.getElementById('outputArea');
    const clearButton       = document.getElementById('clearButton');
    const parseButton       = document.getElementById('parseButton');
    const downloadButton    = document.getElementById('downloadButton');

    clearButton.onclick = function() {
        inputArea.value = '';
    };

    parseButton.onclick = function() {
        outputArea.value = parse(inputArea.value);
    };

    downloadButton.onclick = function() {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + outputArea.value);
        element.setAttribute('download', levelNameInput.value + ".json");
        element.style.display = 'none';

        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    };

    const parse = function(code) {
        const level = new Level(levelNameInput.value);

        level.setSpawn(code);

        const doorWallMask   = new RegExp('^' + doorMask);
        const doorKeyMask    = new RegExp(doorMask);
        const objectsStrings = code.match( new RegExp(objMask, 'g') );
        const doors          = {};

        // 1st pass: initializing objects and collecting doors info.
        for (var i = 0, l = objectsStrings.length; i < l; i++) {
            let obj = level.setObject(i, objectsStrings[i]);

            if (objectsStrings[i].match(doorWallMask)) {
                const key = objectsStrings[i].match(doorKeyMask)[0];

                if (!doors[key]) {
                    doors[key] = [];
                }

                doors[key].push(obj.id);
            }
        }

        var j;
        // 2nd pass: assigning doors.
        for (i = 0, l = level.objects.length; i < l; i++) {
            if (level.objects[i].hasOwnProperty('doors')) {
                const key = level.objects[i].doors;

                level.objects[i].doors = doors[key];
                for (j = 0; j < doors[key].length; j++) {
                    level.objects[ doors[key][j] ].owners.push(level.objects[i].id);
                }
            }
        }

        // 3rd pass: cleaning up code.
        for (i = 0, l = level.objects.length; i < l; i++) {
            if (level.objects[i].hasOwnProperty('owners')) {
                if (level.objects[i].owners.length <= 1) {
                    delete level.objects[i].owners;
                }
            }
        }

        return JSON.stringify(level, null, 0);
    };

    const toNumber = function(n) {
        if (!isNaN(parseFloat(n)) && isFinite(n)) {
            return Math.floor(Number(n));
        }
        
        return INVALID;
    };

    const convertColor = function(str) {
        return {
            "r": parseInt(str.slice(2, 4), 16),
            "g": parseInt(str.slice(4, 6), 16), 
            "b": parseInt(str.slice(6, 8), 16),
            "a": 0
        };
    };

    const INVALID       = 'INVALID_DATA';

    const objTypes = {
        'ObjWall': {
            id: 1,
            toType: function(obj, str) {
                obj.type = this.id;
                obj.owners = [];

                var mask    = new RegExp(argsMask);
                var props   = str.match(mask);

                if (!props) {
                    console.error(`Invalid object properties; can't apply mask ${mask}`);
                    return;
                }

                props = props[0].replace( new RegExp('(\\s)*', 'g'), '' ).split( new RegExp(',', 'g') );

                obj.x       = toNumber(props[0]);
                obj.y       = toNumber(props[1]);
                obj.width   = toNumber(props[2]);
                obj.height  = toNumber(props[3]);
                obj.color   = convertColor(props[4]);
            }
        },
        'ObjTeleport': {
            id: 2,
            toType: function(obj, str) {
                obj.type = this.id;
                obj.isBad = !( !!str.match(new RegExp(isBadMask)) );

                var mask    = new RegExp(argsMask);
                var props   = str.match(mask);

                if (!props) {
                    console.error(`Invalid object properties; can't apply mask ${mask}`);
                    return;
                }

                props = props[0].replace( new RegExp('(\\s)*', 'g'), '' ).split( new RegExp(',', 'g') );

                obj.x       = toNumber(props[0]);
                obj.y       = toNumber(props[1]);
                obj.width   = toNumber(props[2]);
                obj.height  = toNumber(props[3]);
            }
        },
        'ObjAreaCounter': {
            id: 3,
            toType: function(obj, str) {
                obj.type = this.id;
                obj.doors = [];

                var mask    = new RegExp(argsMask);
                var props   = str.match(mask);

                if (!props) {
                    console.error(`Invalid object properties; can't apply mask ${mask}`);
                    return;
                }

                props = props[0].replace( new RegExp('(\\s)*', 'g'), '' ).split( new RegExp(',', 'g') );

                obj.doors   = props[0];
                obj.x       = toNumber(props[1]);
                obj.y       = toNumber(props[2]);
                obj.width   = toNumber(props[3]);
                obj.height  = toNumber(props[4]);
                obj.count   = toNumber(props[5]);
                obj.color   = convertColor(props[6]);
            }
        },
        'ObjClickBox': {
            id: 4,
            toType: function(obj, str) {
                obj.type = this.id;
                obj.doors = [];

                var mask    = new RegExp(argsMask);
                var props   = str.match(mask);

                if (!props) {
                    console.error(`Invalid object properties; can't apply mask ${mask}`);
                    return;
                }

                props = props[0].replace( new RegExp('(\\s)*', 'g'), '' ).split( new RegExp(',', 'g') );

                obj.doors   = props[0];
                obj.x       = toNumber(props[1]);
                obj.y       = toNumber(props[2]);
                obj.width   = toNumber(props[3]);
                obj.height  = toNumber(props[4]);
                obj.count   = toNumber(props[5]);
                obj.relaxationTime = toNumber(props[6]);
                obj.color   = convertColor(props[7]);
            }
        }
    };

    const singleNumMask = '-?(\\d)+';
    const numberMask    = '(\\s)*' + singleNumMask + '(\\s)*';
    const numbersMask   = '\\b(' + numberMask + ',?){2,}\\b';
    const spawnMask     = 'Level\\(' + numbersMask + '\\)';
    const colorMask     = '0x((\\d)*([a-f]*[A-F])*)+';
    const doorMask      = 'wallByColor\\[\\d\\]';
    const argsMask      = '(' + doorMask + ',(\\s)*)?' + numbersMask + ',?(\\s)*(' + colorMask + ')?';
    const addObjMask    = 'AddObject(\\s)*\((.)*\)';
    const addDoorMask   = doorMask + '\\.push_back\\((' + addObjMask + ')*\\)';
    const objMask       = '(' + addDoorMask + '|' + addObjMask + ')';
    const isBadMask     = 'LevelManager\\:\\:GetNextLevel\\(this\\)';
    const objTypeMask   = (function() {
        var str = '(', notEmpty = false;

        for (var type in objTypes) {
            notEmpty = true;
            str += type + '|';
        }

        if (notEmpty) {
            str = str.substring(0, str.length - 1);
        }

        str += ')';

        return str;
    })();
    
    const Level = function(name) {
        this.spawn = {
            x: 0,
            y: 0
        };

        this.objects = [];
        this.lvlname = name;
    };

    Level.prototype.setSpawn = function(str) {
        var mask        = new RegExp(spawnMask);
        const spawnArr  = str.match(mask);

        if (!spawnArr) {
            console.error(`Spawn data is invalid: can't apply mask ${mask}`);

            this.spawn.x    = INVALID;
            this.spawn.y    = INVALID;

            return;
        }

        mask            = new RegExp(singleNumMask, 'g');
        const spawnStr  = spawnArr[0];
        const coords    = spawnStr.match( mask );

        if (coords) {
            this.spawn.x    = toNumber(coords[0]);
            this.spawn.y    = toNumber(coords[1]);
        } else {
            console.error(`Spawn data is invalid: ${spawnStr}; can't apply mask ${mask}`);

            this.spawn.x    = INVALID;
            this.spawn.y    = INVALID;
        }
    };

    Level.prototype.setObject = function(id, str) {
        const typeMask  = new RegExp(objTypeMask);
        var obj         = {id: id};
        var type        = str.match(typeMask);

        if (!type) {
            obj.type = INVALID;
            console.error(`Invalid object type; can't apply mask ${typeMask}`);
            return;
        }

        objTypes[ type[0] ].toType(obj, str);
        this.objects.push(obj);

        return obj;
    };

})(this);