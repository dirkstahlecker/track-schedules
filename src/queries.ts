import {Request, Response} from 'express';

export const getAllDisplayNamesEndpoint = async(req: Request, res: Response) => {
	console.log(`/api/displayName/all`);

  const result = await DisplayNamesDB.get();

	res.set('Content-Type', 'application/json');
	res.json(result);
}
