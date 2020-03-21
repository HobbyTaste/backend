import {Router, Request, Response} from 'express';
import {isNil} from 'lodash';

import Hobby, {IHobby} from '../models/hobby';
import multer from "multer";
import config from "config";
import {uploadFileToS3} from "../utils/aws";
import logger from "../utils/logger";

const hobbyRouter: Router = Router();

const upload = multer({limits: {fieldSize: Number(config.get('aws.maxFileSize'))}});

/**
 * Добавление нового хобби в БД
 */
hobbyRouter.post('/add', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
      if (!req.session || !req.session.provider) {
          res.status(403).send('Неавторизированный партнер');
          return;
      }
      const hobbyInfo: Partial<IHobby> = {...req.body};
      const file = req.file;
      if (file) {
          hobbyInfo.avatar = await uploadFileToS3('hobbies', file);
      }
      //+79182725831 Александра Сергеевна.
      const {_id: owner} = req.session.provider;
      const newHobby = new Hobby({...hobbyInfo, owner});
      await newHobby.save();
      res.status(200).send();
  } catch (e) {
      res.status(500).send(e);
  }
});

/**
 * Поиск хобби по вхождению в него слова
 * label - название хобби (возможно только часть)
 * metroId - id-метро берущийся из стороннего API
 */
hobbyRouter.get('/find', async (req: Request, res: Response) => {
    const {label, metroId}: Partial<IHobby> = req.query;
    if (!isNil(label)) {
        try {
            const numberMetroId = Number(metroId);
            const hobbies = isNaN(numberMetroId)
                ? await Hobby.findByLabel(label)
                : await Hobby.findByLabelWithGeo(label, numberMetroId);
            res.json(hobbies);
            return;
        } catch (e) {
            res.status(500).send(e);
            return;
        }
    }
    res.status(400).send(`typeof label = ${typeof label}`);
});

/**
 * Поиск хобби с нативной фильтрацией
 */
hobbyRouter.get('/filter', async (req: Request, res: Response) => {
    const {...filters} = req.query;
    try {
        const hobbies = await Hobby.find(filters);
        res.json(hobbies);
    } catch (e) {
        logger.error(e);
        res.status(500).json(e);
    }
});


/**
 * Возвращает все хобби из БД
 */
hobbyRouter.get('/all', async (req: Request, res: Response) => {
    try {
        const hobbies = await Hobby.find({});
        res.json(hobbies);
    } catch (e) {
        res.status(500).send(e);
    }
    return;
});

/**
 * Возвращает информацию по конкретному хобби
 * id - параметр GET запроса
 */
hobbyRouter.get('/info', async (req: Request, res: Response) => {
    const {id} = req.query;
    try {
        const hobby = await Hobby.findById(id);
        res.json(hobby);
    } catch (e) {
        res.status(500).send(e);
    }
});

/**
 * Обновляет данные по хобби и его id
 * id - параметр запроса
 */
hobbyRouter.post('/edit', async (req: Request, res: Response) => {
    const {id} = req.query;
    const updateParams: IHobby = {...req.body};
    try {
        await Hobby.findByIdAndUpdate(id, updateParams);
        res.end();
    } catch (e) {
        res.status(500).send(e);
    }
});

hobbyRouter.get('/subscribe', async (req: Request, res: Response) => {
    if (!req.session || !req.session.user) {
        res.status(403).send('Не авторизирован');
        return;
    }
    const {_id: userId} = req.session.user;
    const {id} = req.query;
    try {
        const hobby: IHobby = Hobby.findById(id) as any;
        if (!hobby) {
            res.status(404).send('Не найдено такого элемнта');
            return;
        }
        const nextSubscribers = hobby.subscribers.concat(userId);
        await Hobby.findByIdAndUpdate(id, {subscribers: nextSubscribers})
    } catch (e) {
        res.status(500).send(e);
    }
});

export default hobbyRouter;