import { Request, Response } from 'express';
export declare class ConfigController {
    private configService;
    constructor();
    getMetadata: (req: Request, res: Response) => Promise<void>;
    getConfig: (req: Request, res: Response) => Promise<void>;
    saveConfig: (req: Request, res: Response) => Promise<void>;
    reloadConfig: (req: Request, res: Response) => Promise<void>;
    getOptions: (req: Request, res: Response) => Promise<void>;
    searchPets: (req: Request, res: Response) => Promise<void>;
    searchItems: (req: Request, res: Response) => Promise<void>;
    searchSkills: (req: Request, res: Response) => Promise<void>;
    searchPetSkills: (req: Request, res: Response) => Promise<void>;
    getPetNames: (req: Request, res: Response) => Promise<void>;
    getItemNames: (req: Request, res: Response) => Promise<void>;
    getTaskNames: (req: Request, res: Response) => Promise<void>;
    getSkillNames: (req: Request, res: Response) => Promise<void>;
    getNatures: (req: Request, res: Response) => Promise<void>;
    searchAbilities: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=ConfigController.d.ts.map