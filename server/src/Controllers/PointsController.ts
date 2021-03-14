import knex from "../database/connection";
import { Request, Response } from "express";

class PointsController {
  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex("points").where("id", id).first();

    if (!point) {
      return response.status(400).json({ message: "Point not found!" });
    }

    const serializedPoint = {
        ...point,
        image_url: `http://10.0.0.191:3333/uploads/${point.image}`,
    }

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.item_id")
      .where("point_items.point_id", id)
      .select("items.id", "items.title");

    return response.json({ point:serializedPoint, items });
  }

  async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = request.body;
    

    const trx = await knex.transaction();

    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const insertedIds = await trx("points").insert(point);

    const pointItems = items
      .split(',')
      .map((item: string) => Number(item.trim()))
      .map((item_id: number) => {
        return {
          item_id,
          point_id: insertedIds[0],
        };
    });

    await trx("point_items").insert(pointItems);

    await trx.commit();

    return response.json({ id: insertedIds, ...point });
  }

  async index(request: Request, response: Response) {
    const { uf, city, items } = request.query;

    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.point_id")
      .whereIn("point_items.item_id", parsedItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

      const serializedPoint = points.map(point => {
        return {
          ...point,
          image_url: `http://10.0.0.191:3333/uploads/${point.image}`,
        };
      });

    return response.json(serializedPoint);
  }
}

export default new PointsController();
