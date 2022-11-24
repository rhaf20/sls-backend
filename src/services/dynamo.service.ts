import { AWSError, DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { getSecret } from '../utils/ssm.util';
import QueryOutput = DocumentClient.QueryOutput;
import QueryInput = DocumentClient.QueryInput;
import BatchWriteItemInput = DocumentClient.BatchWriteItemInput;
import BatchWriteItemOutput = DocumentClient.BatchWriteItemOutput;
import PutItemInput = DocumentClient.PutItemInput;
import PutItemOutput = DocumentClient.PutItemOutput;
import UpdateItemInput = DocumentClient.UpdateItemInput;
import UpdateItemOutput = DocumentClient.UpdateItemOutput;
import DeleteItemInput = DocumentClient.DeleteItemInput;
import DeleteItemOutput = DocumentClient.DeleteItemOutput;


export class DynamoService {

	private static instance: DynamoService;

	private dynamo: DocumentClient;

	private constructor() {
	}

	async initDynamoService() {
		const region = await getSecret("REGION");
		this.dynamo = new DynamoDB.DocumentClient({
			region,
			convertEmptyValues: true
		});
	}

	query(queryInput: QueryInput): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initDynamoService();
			await this.dynamo.query(queryInput, (err: AWSError, data: QueryOutput) => {
				if (err) {
					return reject(err);
				}
				resolve(data.Items);
			});
		});
	}

	insert(putInput: PutItemInput): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initDynamoService();
			await this.dynamo.put(putInput, (err: AWSError, data: PutItemOutput) => {
				if (err) {
					return reject(err);
				}
				resolve(data)
			});
		});
	}

	insertBatch(items: any[], tableName: string): Promise<any> {
		const params: BatchWriteItemInput = {
			RequestItems: {
				[tableName]: items.map((item: any) => {
					return { PutRequest: { Item: item } };
				})
			}
		};
		return new Promise(async (resolve, reject) => {
			await this.initDynamoService();
			await this.dynamo.batchWrite(params, (err: AWSError, data: BatchWriteItemOutput) => {
				if (err) {
					return reject(err);
				}
				resolve(data)
			});
		});
	}

	update(updateInput: UpdateItemInput): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initDynamoService();
			await this.dynamo.update(updateInput, (err: AWSError, data: UpdateItemOutput) => {
				if (err) {
					return reject(err);
				}
				resolve(data)
			});
		});
	}

	delete(deleteInput: DeleteItemInput): Promise<any> {
		return new Promise(async (resolve, reject) => {
			await this.initDynamoService();
			await this.dynamo.delete(deleteInput, (err: AWSError, data: DeleteItemOutput) => {
				if (err) {
					return reject(err);
				}
				resolve(data.Attributes);
			});
		});
	}

	static getInstance(): DynamoService {
		if (!DynamoService.instance) {
			DynamoService.instance = new DynamoService();
		}
		return DynamoService.instance;
	}
}
