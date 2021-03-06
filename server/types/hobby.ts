import {Document, Model} from 'mongoose'
import {IComment} from "./comment";


export type SocialServices = "vk" | "instagram" | "facebook"

export enum TariffPlans {
    top,
    widget,
    poster,
}

export interface IHobby extends Document {
    label: string;
    phone?: string;
    email?: string;
    website?: string;
    contacts: Record<SocialServices, string>;
    address?: string;
    location: string;
    metroStation?: string;
    metroId?: string;
    description: string;
    shortDescription: string;
    owner: string; // foreign key
    subscribers: string[]; // foreign key
    providerSubscribers: string[]; // foreign key
    category?: string;
    avatar?: string;
    rating: number;
    comments: string[]; // foreign key
    parking: boolean;
    equipment: boolean;
    novice: boolean;
    children: boolean;
    facilities?: string;
    special?: string;
    price: {
        title: string;
        priceList: string;
    }
    monetization: {
        tariff: TariffPlans;
        activationDate?: string;
        expirationDate?: string;
        cost?: number;
    }[]
    workTime: string[];
    addComment(commentId: string): Promise<IHobby>;
    userCommentsCount(): Promise<number>;
    userComments(): Promise<IComment[]>;
}

export interface IHobbyModel extends Model<IHobby> {
    findByLabel: (label: string) => Promise<IHobby[]>,
    findByLabelWithGeo: (label: string, metroId: number) => Promise<IHobby>,
}
