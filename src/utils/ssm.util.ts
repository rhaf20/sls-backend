import AWS from 'aws-sdk';
const ssm = new AWS.SSM();

export const getSecret = async (secretName: string): Promise<string> => {
  console.log(`Getting secret for ${secretName}`);
  const params = {
    Name: secretName,
    WithDecryption: true,
  };

  const result = await ssm.getParameter(params).promise();
  return result.Parameter.Value;
}