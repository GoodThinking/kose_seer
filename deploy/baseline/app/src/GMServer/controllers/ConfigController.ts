import { Request, Response } from 'express';
import { ConfigService } from '../services/ConfigService';
import { Logger } from '../../shared/utils/Logger';

export class ConfigController {
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  // 获取配置元数据
  public getMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const metadata = await this.configService.getMetadata();
      res.json({ success: true, data: metadata });
    } catch (error) {
      Logger.Error('[ConfigController] 获取元数据失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取配置数据
  public getConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const data = await this.configService.getConfig(type);
      res.json({ success: true, data });
    } catch (error) {
      Logger.Error(`[ConfigController] 获取配置失败: ${req.params.type}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 保存配置数据
  public saveConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const { data } = req.body;
      
      Logger.Info(`[ConfigController] 收到保存配置请求: ${type}`);
      Logger.Debug(`[ConfigController] 数据大小: ${JSON.stringify(data).length} 字节`);
      
      if (!data) {
        res.status(400).json({ success: false, error: '缺少配置数据' });
        return;
      }
      
      await this.configService.saveConfig(type, data);
      res.json({ success: true, message: '配置保存成功' });
    } catch (error) {
      Logger.Error(`[ConfigController] 保存配置失败: ${req.params.type}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 重载配置
  public reloadConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      await this.configService.reloadConfig(type);
      res.json({ success: true, message: '配置重载成功' });
    } catch (error) {
      Logger.Error(`[ConfigController] 重载配置失败: ${req.params.type}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取下拉选项
  public getOptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const options = await this.configService.getOptions(type);
      res.json({ success: true, data: options });
    } catch (error) {
      Logger.Error(`[ConfigController] 获取选项失败: ${req.params.type}`, error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 搜索精灵选项（分页）
  public searchPets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query = '', page = 1, pageSize = 50 } = req.query;
      const result = await this.configService.searchPetOptions(
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      Logger.Error('[ConfigController] 搜索精灵失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 搜索物品选项（分页）
  public searchItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query = '', page = 1, pageSize = 50 } = req.query;
      const result = await this.configService.searchItemOptions(
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      Logger.Error('[ConfigController] 搜索物品失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 搜索技能选项（分页）
  public searchSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query = '', page = 1, pageSize = 50 } = req.query;
      const result = await this.configService.searchSkillOptions(
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      Logger.Error('[ConfigController] 搜索技能失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 搜索指定精灵的技能选项（分页）
  public searchPetSkills = async (req: Request, res: Response): Promise<void> => {
    try {
      const { petId } = req.params;
      const { query = '', page = 1, pageSize = 50 } = req.query;
      
      Logger.Debug(`[ConfigController] searchPetSkills 请求: petId=${petId}, query="${query}", page=${page}, pageSize=${pageSize}`);
      
      if (!petId) {
        res.status(400).json({ success: false, error: '缺少参数: petId' });
        return;
      }
      
      const result = await this.configService.searchPetSkillOptions(
        parseInt(petId as string),
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      
      Logger.Debug(`[ConfigController] searchPetSkills 返回: items=${result.items.length}, total=${result.total}`);
      
      res.json({ success: true, data: result });
    } catch (error) {
      Logger.Error('[ConfigController] 搜索精灵技能失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取精灵名字映射
  public getPetNames = async (req: Request, res: Response): Promise<void> => {
    try {
      const petNames = await this.configService.getPetNames();
      res.json({ success: true, data: petNames });
    } catch (error) {
      Logger.Error('[ConfigController] 获取精灵名字失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取物品名字映射
  public getItemNames = async (req: Request, res: Response): Promise<void> => {
    try {
      const itemNames = await this.configService.getItemNames();
      res.json({ success: true, data: itemNames });
    } catch (error) {
      Logger.Error('[ConfigController] 获取物品名字失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取任务名字映射
  public getTaskNames = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskNames = await this.configService.getTaskNames();
      res.json({ success: true, data: taskNames });
    } catch (error) {
      Logger.Error('[ConfigController] 获取任务名字失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取技能名字映射
  public getSkillNames = async (req: Request, res: Response): Promise<void> => {
    try {
      const skillNames = await this.configService.getSkillNames();
      res.json({ success: true, data: skillNames });
    } catch (error) {
      Logger.Error('[ConfigController] 获取技能名字失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 获取性格列表
  public getNatures = async (req: Request, res: Response): Promise<void> => {
    try {
      const natures = await this.configService.getNatures();
      res.json({ success: true, data: natures });
    } catch (error) {
      Logger.Error('[ConfigController] 获取性格列表失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  // 搜索特性选项（分页）
  public searchAbilities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query = '', page = 1, pageSize = 50 } = req.query;
      const result = await this.configService.searchAbilityOptions(
        query as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      Logger.Error('[ConfigController] 搜索特性失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
