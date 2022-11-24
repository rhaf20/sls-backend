export abstract class AssetTable {

	static TABLE_NAME = 'MSAssetTable';
	static HASH_KEY = 'assetId';
	static SORT_KEY = 'assetType';

	static TYPE_GSI_NAME = 'AssetTypeIndex';
	static TYPE_GSI_HASH = 'assetType';

	static COMPANY_GSI_NAME = 'AssetCompanyIndex';
	static COMPANY_GSI_HASH = 'assetType';
	static COMPANY_GSI_SORT = 'companyId';

	static FARM_GSI_NAME = 'AssetFarmIndex';
	static FARM_GSI_HASH = 'assetType';
	static FARM_GSI_SORT = 'farmId';

	static SHED_GSI_NAME = 'AssetShedIndex';
	static SHED_GSI_HASH = 'assetType';
	static SHED_GSI_SORT = 'shedId';
}

export abstract class UserTable {

	static TABLE_NAME = 'ZYDUserTable';
	static HASH_KEY = 'id';
	static SORT_KEY = 'role';

	static EMAIL_GSI_NAME = 'UserEmailIndex';
	static EMAIL_GSI_HASH = 'email';
}

export abstract class AlarmTable {

	static TABLE_NAME = 'MSAlarmTable';
	static HASH_KEY = 'alarmId';
	static SORT_KEY = 'timestamp';

	static DEVICE_GSI_NAME = 'DeviceTSIndex';
	static DEVICE_GSI_HASH = 'deviceId';
	static DEVICE_GSI_SORT = 'timestamp';
}

export abstract class TimeseriesTable {

	static TABLE_NAME = 'MSTimeseriesTable';
	static HASH_KEY = 'assetId';
	static SORT_KEY = 'timestamp';
}

export abstract class ConnectionTable {

	static TABLE_NAME = 'MSConnectionTable';
	static HASH_KEY = 'userId';
	static SORT_KEY = 'connectionId';

	static TYPE_GSI_NAME = 'ConnectionTypeIndex';
	static TYPE_GSI_HASH = 'cType';
	static TYPE_GSI_RANGE = 'connectionId';
}

export abstract class MessageLogTable {
	static TABLE_NAME = 'MSMessageLogTable';
	static HASH_KEY = 'assetId';
	static SORT_KEY = 'timestamp';
}

export abstract class ApiConstant {
	/* Error messages */
	static MISSING_PAYLOAD = 'Request payload is required.';
	static ACCESS_DENIED = 'Access denied.';
	static MISSING_PARAM = 'Missing param';
	static INVALID_PARAM = 'Invalid param';

	/* Parameters */
	static ACTION = 'action';
	static ASSET_ID = 'assetId';
	static ASSET_TYPE = 'assetType';
	static COMPANY_ID = 'companyId';
	static FARM_ID = 'farmId';
	static SHED_ID = 'shedId';
	static DEVICE_ID = 'deviceId';
	static USER_ID = 'userId';

	/* Device data */
	static START = 'start';
	static END = 'end';
	static MODE = 'mode';
}

export abstract class EndpointConstant {
	
	static USER_ENDPOINT = '/user';
	static USER_DETAIL_ENDPOINT = '/user/{userId}';

	static BUILDING_ENDPOINT = '/building';
	static BUILDING_DETAIL_ENDPOINT = '/building/{buildingId}';

	static SYSTEM_ENDPOINT = '/system';
	static SYSTEM_DETAIL_ENDPOINT = '/system/{systemId}';
	
	static SYSTEM_USER_ENDPOINT = '/systemUser';
	
	static COMMAND_ENDPOINT = '/command';
	static COMMAND_LAST_ENDPOINT = '/command/last';
	
	static OPTI_ENDPOINT = '/opti';
	static OPTI_LAST_ENDPOINT = '/opti/last';

	static PROCESS_DATA_ENDPOINT = '/data/process';
	static STATUS_DATA_ENDPOINT = '/data/status';


	/* Asset */
	static ASSET_ENDPOINT = '/asset/{assetType}';
	static ASSET_DETAIL_ENDPOINT = '/asset/{assetType}/{assetId}';
	static ASSET_ACTION_ENDPOINT = '/asset/{assetType}/{assetId}/action';

	static DATA_ENDPOINT = '/data/{dataType}';

	static VERIFY_CALL = '/connect/verify';

	/* Websocket */
	public static CONNECT_ROUTE = '$connect';
	public static DISCONNECT_ROUTE = '$disconnect';
	public static MESSAGE_ROUTE = 'message';
	public static DEFAULT_ROUTE = '$default';
}

export abstract class RegexConstant {

	static DEVICE_TYPE_PATTERN = /\d/g;

	/**
	 * Matches string C0001/sh/update
	 *
	 * First 2 letters should be alphabet.
	 * Next 4 letters should be numeric.
	 * Next is '/' tested by pattern '\/'.
	 * Next is string literal 'sh'.
	 * Next is '/'.
	 * Last part is string literal 'update'.
	 */
	static TOPIC_PATTERN = '^[a-zA-Z]{2}[0-9]{4}\/sh\/update$';

	static UUID_PATTERN = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;

	static DEVICE_ID_PATTERN = /^[a-zA-Z]{2}[0-9]{4}$/;
}

export abstract class TZConstant {
	static readonly NZ = 'Pacific/Auckland';
}
