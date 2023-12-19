"use strict";
var errorDisabled = {
    message: "Function is disabled",
    code: 12 /* nkruntime.Codes.UNIMPLEMENTED */
};
var invalidUserId = {
    message: "RPC is only callable from server to server.",
    code: 7 /* nkruntime.Codes.PERMISSION_DENIED */
};
var invalidVersion = {
    message: "Provided version or hash is incorrect.",
    code: 7 /* nkruntime.Codes.PERMISSION_DENIED */
};
var noMatches = {
    message: "No matches found with criteria.",
    code: 5 /* nkruntime.Codes.NOT_FOUND */
};
var CurrentHash = 2708603976;
var CurrentVersion = "0.6.0";
var InitModule = function (ctx, logger, nk, initializer) {
    initializer.registerStorageIndex("MatchesIx", "matches_collection", "", ["location"], 5000, true);
    // Event listeners
    initializer.registerBeforeCreateGroup(beforeCreateGroup);
    // Server RPC
    initializer.registerRpc("register_server", serverRegister);
    // Client RPC
    initializer.registerRpc("client_find_match", clientFindMatch);
    initializer.registerRpc("client_get_match_info", clientGetMatchInfo);
};
var beforeCreateGroup = function (ctx, logger, nk, data) {
    logger.error("Tried to use disabled function.");
    throw errorDisabled;
};
var serverRegister = function (ctx, logger, nk, payload) {
    logger.debug("Received RPC with payload " + payload);
    if (ctx.userId != null) {
        logger.error("RPC was called by a user.");
        throw invalidUserId;
    }
    var message = JSON.parse(payload);
    /*if (message.Hash != CurrentHash) {
        logger.error("Server registering has invalid hash.")
        throw invalidVersion;
    }*/
    // TODO: Cant get this to find the file
    // Decode whitelist.
    /*file, err := nk.ReadFile("nakama/data/serverWhitelist.json")
    if err != nil {
        return "", runtime.NewError("Main server could not read whitelist file.", NOT_FOUND)
    }

    result := map[string]interface{}{}
    json.NewDecoder(file).Decode(&result)

    defer file.Close()

    // Check if server is whitelisted.
    if _, isMapContainsKey := result[message.AuthToken]; !isMapContainsKey {
        return "", runtime.NewError("Server is not whitelisted.", PERMISSION_DENIED)
    }*/
    var matchInfo = {
        "location": message.Location,
        "ip": ctx.clientIp,
        "gamePort": message.GamePort,
        "statusPort": message.StatusPort
    };
    var matchId = nk.uuidv4();
    var write = {
        collection: "matches_collection",
        key: matchId,
        value: matchInfo,
        permissionRead: 1,
        permissionWrite: 0,
        userId: undefined
    };
    nk.storageWrite([write]);
    var registerServerResponse = {
        ServerId: matchId,
        AdminIpAddressRanges: undefined
    };
    return JSON.stringify(registerServerResponse);
};
var clientFindMatch = function (ctx, logger, nk, payload) {
    logger.debug("Received RPC with payload " + payload);
    var message = JSON.parse(payload);
    if (message.Version != CurrentVersion) {
        logger.error("Client connecting has invalid version.");
        throw invalidVersion;
    }
    /*if (message.Hash != CurrentHash) {
        logger.error("Client connecting has invalid hash.")
        throw invalidVersion;
    }*/
    var joinQuery = "+value.location:" + message.Location; // TODO: Sanitize this
    var matches = nk.storageIndexList("MatchesIx", joinQuery, 10);
    if (matches.length == 0) {
        logger.error("No matches found with query" + joinQuery);
        throw noMatches;
    }
    var findMatchesResponse = {
        MatchesId: matches.map(function (match) { return match.key; })
    };
    return JSON.stringify(findMatchesResponse);
};
var clientGetMatchInfo = function (ctx, logger, nk, payload) {
    logger.debug("Received RPC with payload " + payload);
    // TODO: Validate payload (matchId).
    var storageRead = {
        collection: "matches_collection",
        key: payload,
        userId: "00000000-0000-0000-0000-000000000000"
    };
    var results = nk.storageRead([storageRead]);
    if (results.length == 0) {
        logger.error("Found no matches with id " + payload);
        throw noMatches;
    }
    if (results.length > 1) {
        logger.warn("Found several matches with id " + payload);
    }
    return JSON.stringify(results[0].value);
};
