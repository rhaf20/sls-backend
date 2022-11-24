import {DynamoService} from './dynamo.service';
import {
	BuildingInterface,
	DeviceInterface,
	FarmInterface,
	ShedInterface,
	TemplateInterface,
	UserInterface
} from '../interfaces';
import {AssetTable} from '../constants';
import {capitalise, ResourceNotFoundException} from '../utils';
import {AssetType} from '../enums';

type Asset = BuildingInterface | FarmInterface | ShedInterface | DeviceInterface | UserInterface | TemplateInterface;

export class AssetService {

	private static instance: AssetService;

	private readonly dynamo: DynamoService;

	private constructor() {
		this.dynamo = DynamoService.getInstance();
	}

	async createAsset(asset: Asset) {
		return await this.dynamo.insert({
			Item: asset,
			TableName: AssetTable.TABLE_NAME,
			ConditionExpression: `attribute_not_exists(${AssetTable.HASH_KEY})`,
			ReturnValues: 'NONE'
		});
	}

	async fetchAssetByAssetId<Asset>(assetId: string, assetType: AssetType): Promise<Asset> {
		const assets: Asset[] = await this.dynamo.query({
			TableName: AssetTable.TABLE_NAME,
			KeyConditionExpression: `${AssetTable.HASH_KEY} = :hashKey and ${AssetTable.SORT_KEY} = :sortKey`,
			ExpressionAttributeValues: {':hashKey': assetId, ':sortKey': assetType},
			Limit: 1
		});
		if (assets.length === 0) {
			throw new ResourceNotFoundException(`${capitalise(assetType.toString())} ${assetId} does not exist.`);
		}
		return assets[0];
	}

	async fetchAssetsByAssetType<Asset>(assetType: AssetType): Promise<Asset[]> {
		return await this.dynamo.query({
			TableName: AssetTable.TABLE_NAME,
			IndexName: AssetTable.TYPE_GSI_NAME,
			KeyConditionExpression: `${AssetTable.TYPE_GSI_HASH} = :hashKey`,
			ExpressionAttributeValues: {':hashKey': assetType}
		});
	}

	async fetchAssetsByCompany<Asset>(assetType: AssetType, companyId: string): Promise<Asset[]> {
		return await this.dynamo.query({
			TableName: AssetTable.TABLE_NAME,
			IndexName: AssetTable.COMPANY_GSI_NAME,
			KeyConditionExpression: `${AssetTable.COMPANY_GSI_HASH} = :hashKey and ${AssetTable.COMPANY_GSI_SORT} = :sortKey`,
			ExpressionAttributeValues: {':hashKey': assetType, ':sortKey': companyId}
		});
	}

	async fetchAssetsByFarm<Asset>(assetType: AssetType, farmId: string): Promise<Asset[]> {
		return await this.dynamo.query({
			TableName: AssetTable.TABLE_NAME,
			IndexName: AssetTable.FARM_GSI_NAME,
			KeyConditionExpression: `${AssetTable.FARM_GSI_HASH} = :hashKey and ${AssetTable.FARM_GSI_SORT} = :sortKey`,
			ExpressionAttributeValues: {':hashKey': assetType, ':sortKey': farmId}
		});
	}

	async fetchAssetsByShed<Asset>(assetType: AssetType, shedId: string): Promise<Asset[]> {
		return await this.dynamo.query({
			TableName: AssetTable.TABLE_NAME,
			IndexName: AssetTable.SHED_GSI_NAME,
			KeyConditionExpression: `${AssetTable.SHED_GSI_HASH} = :hashKey and ${AssetTable.SHED_GSI_SORT} = :sortKey`,
			ExpressionAttributeValues: {':hashKey': assetType, ':sortKey': shedId}
		});
	}

	async updateAsset(asset: Asset) {
		return await this.dynamo.insert({
			Item: asset,
			TableName: AssetTable.TABLE_NAME,
			ConditionExpression: `attribute_exists(${AssetTable.HASH_KEY})`,
			ReturnValues: 'NONE'
		});
	}

	async updateBatch(assets: Asset[]) {
		return await this.dynamo.insertBatch(assets, AssetTable.TABLE_NAME);
	}

	async deleteAssetByAssetId<Asset>(assetId: string, assetType: AssetType): Promise<Asset> {
		return await this.dynamo.delete({
			TableName: AssetTable.TABLE_NAME,
			Key: {assetId, assetType},
			ReturnValues: "ALL_OLD"
		});
	}

	static getInstance(): AssetService {
		if (!AssetService.instance) {
			AssetService.instance = new AssetService();
		}
		return AssetService.instance;
	}
}
