type UploadData = {
  fileName: string;
  content: string;
};

export const GOOGLE_DRIVE_VCS_FILE_NAME = 'identity-snap-vcs.json';
const BOUNDARY = '314159265358979323846';

export const verifyToken = async (accessToken: string): Promise<string> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`,
      {
        method: 'GET',
      },
    );
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(data.error_description);
    }

    return data.email;
  } catch (error) {
    console.error(`Failed to verify token: ${error}`);
    throw new Error(`Failed to verify token: ${error}`);
  }
};

const searchFile = async (accessToken: string, fileName: string) => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name = '${fileName}' and trashed = false`,
      {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${accessToken}`,
        }),
      },
    );
    const data = await res.json();

    const count = data.files.length;

    return { count, id: count === 1 ? data.files[0].id : null };
  } catch (error) {
    console.error(`Failed to search file: ${error}`);
    throw new Error(`Failed to search file: ${error}`);
  }
};

const getRequestBodyToUpload = ({ fileName, content }: UploadData) => {
  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
    // parents: ["root"], // Folder ID at Google Drive
  };

  const delimiter = `\r\n--${BOUNDARY}\r\n`;
  const closeDelim = `\r\n--${BOUNDARY}--`;

  let multipartRequestBody = `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(
    metadata,
  )}${delimiter}Content-Type: text/plain\r\n`;
  multipartRequestBody += `\r\n${content}`;
  multipartRequestBody += closeDelim;

  return multipartRequestBody;
};

export const uploadToGoogleDrive = async (
  accessToken: string,
  { fileName, content }: UploadData,
) => {
  if (!accessToken) {
    console.error('Access token not found');
    return false;
  }

  const existFile = await searchFile(accessToken, fileName);
  const multipartRequestBody = getRequestBodyToUpload({ fileName, content });

  try {
    let res;
    if (existFile.id) {
      res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existFile.id}?uploadType=multipart&fields=id`,
        {
          method: 'PATCH',
          headers: new Headers({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
          }),
          body: multipartRequestBody,
        },
      );
    } else {
      res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: new Headers({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
          }),
          body: multipartRequestBody,
        },
      );
    }
    const val = await res.json();

    return val;
  } catch (error) {
    console.error('Could not upload to google drive', error);
    return false;
  }
};

export const createEmptyFile = async (
  accessToken: string,
  fileName: string,
) => {
  if (!accessToken) {
    console.error('Access token not found');
    return false;
  }

  const multipartRequestBody = getRequestBodyToUpload({
    fileName,
    content: '{}',
  });

  try {
    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
        }),
        body: multipartRequestBody,
      },
    );
    const val = await res.json();

    return val;
  } catch (error) {
    console.error('Could not create file on google drive', error);
    return false;
  }
};

export const getFileContent = async (accessToken: string, fileId: string) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      method: 'GET',
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
      }),
    },
  );
  return res.json();
};

export const getGoogleVCs = async (accessToken: string, fileName: string) => {
  if (!accessToken) {
    console.error('Access token not found');
    throw new Error('Google account was not configured');
  }

  const existFile = await searchFile(accessToken, fileName);

  if (existFile.id) {
    const content = await getFileContent(accessToken, existFile.id);
    return content;
  }
  return null;
};
