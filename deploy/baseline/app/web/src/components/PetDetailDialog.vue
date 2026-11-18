<template>
  <el-dialog
    v-model="visible"
    :title="`精灵详情 - ${petName}`"
    width="1000px"
    @close="handleClose"
    :lock-scroll="false"
    class="pet-detail-dialog"
  >
    <div v-if="pet" class="pet-detail-content">
      <!-- 基本信息 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
            <div v-if="!isEditing" style="margin-left: auto; display: flex; gap: 8px;">
              <el-button 
                size="small" 
                @click="handleRefresh"
                :loading="refreshing"
              >
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click="startEdit"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
            <div v-else style="margin-left: auto; display: flex; gap: 8px;">
              <el-button size="small" @click="cancelEdit">取消</el-button>
              <el-button size="small" type="primary" @click="saveEdit">保存</el-button>
            </div>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="精灵ID">{{ pet.id }}</el-descriptions-item>
          <el-descriptions-item label="精灵名称">{{ petName }}</el-descriptions-item>
          <el-descriptions-item label="等级">
            <span v-if="!isEditing">Lv.{{ pet.level }}</span>
            <el-input-number 
              v-else
              v-model="editForm.level" 
              :min="1" 
              :max="100"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="捕获时间" :span="2">{{ formatCatchTime(pet.catchTime) }}</el-descriptions-item>
          <el-descriptions-item label="性格">
            <span v-if="!isEditing">{{ getNatureName(pet.nature) }}</span>
            <el-select 
              v-else
              v-model="editForm.nature" 
              filterable 
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="nature in natureOptions"
                :key="nature.id"
                :label="`${nature.id} - ${nature.name}`"
                :value="nature.id"
              />
            </el-select>
          </el-descriptions-item>
          <el-descriptions-item label="经验值" :span="3">
            <span v-if="!isEditing">{{ pet.exp?.toLocaleString() || 0 }}</span>
            <el-input-number 
              v-else
              v-model="editForm.exp" 
              :min="0" 
              :max="999999999"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 属性值 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>属性值</span>
            <el-tooltip v-if="!isEditing" content="属性值由等级、DV、EV自动计算" placement="top">
              <el-icon style="color: #6b7280; cursor: help;"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="HP">
            <span v-if="!isEditing">{{ pet.hp }} / {{ pet.maxHp }}</span>
            <div v-else style="display: flex; gap: 8px; align-items: center;">
              <el-input-number 
                v-model="editForm.hp" 
                :min="1" 
                :max="9999"
                size="small"
                controls-position="right"
                style="width: 80px"
              />
              <span>/</span>
              <el-input-number 
                v-model="editForm.maxHp" 
                :min="1" 
                :max="9999"
                size="small"
                controls-position="right"
                style="width: 80px"
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="攻击">
            <span v-if="!isEditing">{{ pet.atk }}</span>
            <el-input-number 
              v-else
              v-model="editForm.atk" 
              :min="1" 
              :max="9999"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="防御">
            <span v-if="!isEditing">{{ pet.def }}</span>
            <el-input-number 
              v-else
              v-model="editForm.def" 
              :min="1" 
              :max="9999"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="特攻">
            <span v-if="!isEditing">{{ pet.spAtk }}</span>
            <el-input-number 
              v-else
              v-model="editForm.spAtk" 
              :min="1" 
              :max="9999"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="特防">
            <span v-if="!isEditing">{{ pet.spDef }}</span>
            <el-input-number 
              v-else
              v-model="editForm.spDef" 
              :min="1" 
              :max="9999"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="速度">
            <span v-if="!isEditing">{{ pet.speed }}</span>
            <el-input-number 
              v-else
              v-model="editForm.speed" 
              :min="1" 
              :max="9999"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="isEditing" style="margin-top: 12px; padding: 8px; background: #fef3c7; border-radius: 6px; font-size: 12px; color: #92400e;">
          <el-icon style="vertical-align: middle;"><Warning /></el-icon>
          注意：直接修改属性值会覆盖自动计算的结果。保存后，这些值不会随等级、DV、EV变化而自动更新。
        </div>
      </el-card>

      <!-- 努力值 (EV) -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Promotion /></el-icon>
            <span>努力值 (EV)</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="HP">
            <span v-if="!isEditing">{{ pet.evHp || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.evHp"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="攻击">
            <span v-if="!isEditing">{{ pet.evAtk || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.evAtk"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="防御">
            <span v-if="!isEditing">{{ pet.evDef || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.evDef"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="特攻">
            <span v-if="!isEditing">{{ pet.evSpAtk || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.evSpAtk"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="特防">
            <span v-if="!isEditing">{{ pet.evSpDef || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.evSpDef"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="速度">
            <span v-if="!isEditing">{{ pet.evSpeed || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.evSpeed"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 个体值 (DV) -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Star /></el-icon>
            <span>个体值 (DV)</span>
          </div>
        </template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="HP">
            <span v-if="!isEditing">{{ pet.dvHp || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.dvHp"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="攻击">
            <span v-if="!isEditing">{{ pet.dvAtk || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.dvAtk"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="防御">
            <span v-if="!isEditing">{{ pet.dvDef || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.dvDef"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="特攻">
            <span v-if="!isEditing">{{ pet.dvSpAtk || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.dvSpAtk"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="特防">
            <span v-if="!isEditing">{{ pet.dvSpDef || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.dvSpDef"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
          <el-descriptions-item label="速度">
            <span v-if="!isEditing">{{ pet.dvSpeed || 0 }}</span>
            <el-input-number
              v-else
              v-model="editForm.dvSpeed"
              :min="0"
              size="small"
              controls-position="right"
              style="width: 100%"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 特性 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Aim /></el-icon>
            <span>特性</span>
          </div>
        </template>

        <!-- 查看模式 -->
        <div v-if="!isEditing">
          <div v-if="currentAbilityId > 0" class="skill-list">
            <div class="skill-item">
              <div class="skill-info">
                <span class="skill-name">{{ getAbilityName(currentAbilityId) }}</span>
                <span class="skill-id">(ID: {{ currentAbilityId }})</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-text">无特性</div>
        </div>

        <!-- 编辑模式 -->
        <div v-else>
          <el-row :gutter="12">
            <el-col :span="18">
              <PaginatedSelect
                v-model="editForm.abilityId"
                placeholder="无特性"
                :fetch-data="fetchAbilityData"
              />
            </el-col>
            <el-col :span="6">
              <el-button size="small" @click="editForm.abilityId = 0">清除特性</el-button>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 技能列表 -->
      <el-card class="detail-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><MagicStick /></el-icon>
            <span>技能列表</span>
          </div>
        </template>
        
        <!-- 查看模式 -->
        <div v-if="!isEditing">
          <div v-if="pet.skillArray && pet.skillArray.length > 0" class="skill-list">
            <div v-for="(skill, index) in pet.skillArray" :key="index" class="skill-item">
              <div class="skill-info">
                <span class="skill-name">{{ getSkillName(skill.id) }}</span>
                <span class="skill-id">(ID: {{ skill.id }})</span>
              </div>
              <div class="skill-pp">
                <span>PP: {{ skill.pp }} / {{ skill.maxPp }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-text">暂无技能</div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="skill-edit-container">
          <!-- 技能过滤按钮 -->
          <div class="skill-filter-buttons">
            <el-button 
              :type="skillFilterMode === 'current' ? 'primary' : 'default'"
              size="small"
              @click="skillFilterMode = 'current'"
            >
              当前精灵全部技能
            </el-button>
            <el-button 
              :type="skillFilterMode === 'all' ? 'primary' : 'default'"
              size="small"
              @click="skillFilterMode = 'all'"
            >
              所有精灵全部技能
            </el-button>
          </div>

          <!-- 技能编辑区域 -->
          <div class="skill-edit-layout">
            <!-- 左侧：当前技能 -->
            <div class="skill-column current-skills">
              <div class="column-title">当前技能</div>
              <div class="skill-slots">
                <div 
                  v-for="(skill, index) in editForm.skillArray" 
                  :key="index" 
                  class="skill-slot"
                  :class="{ 'empty': !skill.id }"
                >
                  <div v-if="skill.id" class="skill-content">
                    <div class="skill-info">
                      <span class="skill-name">{{ getSkillName(skill.id) }}</span>
                      <span class="skill-id">(ID: {{ skill.id }})</span>
                    </div>
                  </div>
                  <div v-else class="empty-slot">空技能槽</div>
                </div>
              </div>
            </div>

            <!-- 中间：操作按钮 -->
            <div class="skill-column actions">
              <div class="column-title">操作</div>
              <div class="action-buttons">
                <el-button 
                  v-for="index in 4" 
                  :key="index"
                  size="small"
                  :disabled="!selectedSkillId"
                  @click="replaceSkill(index - 1)"
                  style="width: 100%"
                >
                  替换技能{{ index }}
                </el-button>
              </div>
            </div>

            <!-- 右侧：全部技能 -->
            <div class="skill-column all-skills">
              <div class="column-title">全部技能</div>
              <PaginatedSelect
                :key="skillSelectKey"
                v-model="selectedSkillId"
                placeholder="搜索并选择技能"
                :fetch-data="fetchSkillDataForEdit"
                :page-size="50"
                style="margin-bottom: 12px"
              />
              <div v-if="selectedSkillId" class="selected-skill-preview">
                <div class="skill-info">
                  <span class="skill-name">{{ getSkillName(selectedSkillId) }}</span>
                  <span class="skill-id">(ID: {{ selectedSkillId }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoFilled, TrendCharts, Promotion, Star, MagicStick, Edit, Warning, Refresh, Aim } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import { configApi } from '@/api/config'
import { gmApi } from '@/api/gm'
import PaginatedSelect from './PaginatedSelect.vue'

interface Props {
  modelValue: boolean
  pet: any
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', pet: any): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const configStore = useConfigStore()

const visible = ref(props.modelValue)
const isEditing = ref(false)
const refreshing = ref(false)
const skillFilterMode = ref<'current' | 'all'>('all')
const selectedSkillId = ref<number>(0)
const skillSelectKey = ref(0) // 用于强制刷新 PaginatedSelect

// 性格选项（从后端加载）
const natureOptions = ref<Array<{ id: number; name: string; category: string }>>([])

// 加载性格选项
const loadNatureOptions = async () => {
  try {
    const natures = await configApi.getNatures() as any
    natureOptions.value = (natures.data || natures).map((nature: any) => ({
      id: nature.id,
      name: nature.name,
      category: nature.desc || nature.category
    }))
  } catch (error) {
    console.error('加载性格选项失败:', error)
    // 使用默认值
    natureOptions.value = [
      { id: 0, name: '孤独', category: '攻击+ 防御-' },
      { id: 1, name: '固执', category: '攻击+ 特攻-' },
      { id: 2, name: '调皮', category: '攻击+ 特防-' },
      { id: 3, name: '勇敢', category: '攻击+ 速度-' },
      { id: 4, name: '大胆', category: '防御+ 攻击-' },
      { id: 5, name: '顽皮', category: '防御+ 特攻-' },
      { id: 6, name: '无虑', category: '防御+ 特防-' },
      { id: 7, name: '悠闲', category: '防御+ 速度-' },
      { id: 8, name: '保守', category: '特攻+ 攻击-' },
      { id: 9, name: '稳重', category: '特攻+ 防御-' },
      { id: 10, name: '马虎', category: '特攻+ 特防-' },
      { id: 11, name: '冷静', category: '特攻+ 速度-' },
      { id: 12, name: '沉着', category: '特防+ 攻击-' },
      { id: 13, name: '温顺', category: '特防+ 防御-' },
      { id: 14, name: '慎重', category: '特防+ 特攻-' },
      { id: 15, name: '狂妄', category: '特防+ 速度-' },
      { id: 16, name: '胆小', category: '速度+ 攻击-' },
      { id: 17, name: '急躁', category: '速度+ 防御-' },
      { id: 18, name: '开朗', category: '速度+ 特攻-' },
      { id: 19, name: '天真', category: '速度+ 特防-' },
      { id: 20, name: '害羞', category: '平衡发展' },
      { id: 21, name: '实干', category: '平衡发展' },
      { id: 22, name: '坦率', category: '平衡发展' },
      { id: 23, name: '浮躁', category: '平衡发展' },
      { id: 24, name: '认真', category: '平衡发展' }
    ]
  }
}

// 监听技能过滤模式变化，强制刷新选择器
watch(skillFilterMode, () => {
  console.log('[PetDetailDialog] 技能过滤模式变化:', skillFilterMode.value)
  selectedSkillId.value = 0
  skillSelectKey.value++ // 强制刷新 PaginatedSelect
})

// 编辑表单
const editForm = ref<any>({
  level: 1,
  nature: 0,
  exp: 0,
  hp: 0,
  maxHp: 0,
  atk: 0,
  def: 0,
  spAtk: 0,
  spDef: 0,
  speed: 0,
  evHp: 0,
  evAtk: 0,
  evDef: 0,
  evSpAtk: 0,
  evSpDef: 0,
  evSpeed: 0,
  dvHp: 0,
  dvAtk: 0,
  dvDef: 0,
  dvSpAtk: 0,
  dvSpDef: 0,
  dvSpeed: 0,
  skillArray: [],
  abilityId: 0
})

// 监听外部变化
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    isEditing.value = false
    selectedSkillId.value = 0
    // 加载性格选项
    loadNatureOptions()
  }
})

// 监听内部变化
watch(visible, (val) => {
  emit('update:modelValue', val)
  // 当对话框打开时加载技能名称和性格选项
  if (val) {
    configStore.fetchSkillNames()
    loadNatureOptions()
  }
})

// 格式化时间戳
const formatCatchTime = (timestamp: number) => {
  if (!timestamp) return '未知'
  // 如果时间戳小于10000000000，说明是秒级时间戳，需要转换为毫秒
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取精灵名称
const petName = computed(() => {
  if (!props.pet) return '未知精灵'
  return configStore.petNames[props.pet.id] || '未知精灵'
})

// 获取性格名称
const getNatureName = (natureId: number) => {
  const nature = natureOptions.value.find(n => n.id === natureId)
  return nature ? `${nature.name} (${nature.category})` : `未知性格(${natureId})`
}

// 获取技能名称
const getSkillName = (skillId: number | undefined) => {
  if (!skillId) return '未知技能'
  return configStore.skillNames[skillId] || `未知技能(${skillId})`
}

// 当前精灵的特性ID
const currentAbilityId = computed(() => {
  if (!props.pet || !props.pet.effectList || props.pet.effectList.length === 0) return 0
  return props.pet.effectList[0].itemId || props.pet.effectList[0].effectID || 0
})

// 特性名称缓存
const abilityNameCache = ref<Record<number, string>>({})

// 获取特性名称
const getAbilityName = (abilityId: number) => {
  if (abilityNameCache.value[abilityId]) return abilityNameCache.value[abilityId]
  // 异步加载
  configApi.searchAbilities(String(abilityId), 1, 50).then((res: any) => {
    const data = res.data || res
    const found = data.items?.find((item: any) => item.value === abilityId)
    if (found) {
      abilityNameCache.value[abilityId] = found.label
    }
  }).catch(() => {})
  return `特性 ${abilityId}`
}

// 获取特性数据（用于分页选择器）
const fetchAbilityData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchAbilities(query, page, pageSize) as any
  return res.data || res
}

// 获取技能数据（用于分页选择器）
const fetchSkillDataForEdit = async (query: string, page: number, pageSize: number) => {
  console.log('[PetDetailDialog] fetchSkillDataForEdit 调用:', { 
    skillFilterMode: skillFilterMode.value, 
    petId: props.pet?.id,
    query, 
    page, 
    pageSize 
  })
  
  if (skillFilterMode.value === 'current') {
    // 获取当前精灵的技能
    const result = await fetchCurrentPetSkills(query, page, pageSize)
    console.log('[PetDetailDialog] 当前精灵技能结果:', result)
    return result
  } else {
    // 获取所有技能
    const res = await configApi.searchSkills(query, page, pageSize) as any
    const result = res.data || res
    console.log('[PetDetailDialog] 所有技能结果:', result)
    return result
  }
}

// 获取当前精灵的技能
const fetchCurrentPetSkills = async (query: string, page: number, pageSize: number) => {
  try {
    console.log('[PetDetailDialog] fetchCurrentPetSkills 调用:', { 
      petId: props.pet?.id, 
      query, 
      page, 
      pageSize 
    })
    
    if (!props.pet || !props.pet.id) {
      console.warn('[PetDetailDialog] 精灵数据无效')
      return { items: [], total: 0 }
    }
    
    // 调用后端API获取当前精灵的所有技能
    const res = await configApi.searchPetSkills(props.pet.id, query, page, pageSize) as any
    const result = res.data || res
    
    console.log('[PetDetailDialog] fetchCurrentPetSkills 结果:', result)
    
    return result
  } catch (error) {
    console.error('[PetDetailDialog] 获取当前精灵技能失败:', error)
    return { items: [], total: 0 }
  }
}

// 开始编辑
const startEdit = () => {
  if (!props.pet) return
  
  // 深拷贝当前精灵数据到编辑表单
  editForm.value = {
    level: props.pet.level || 1,
    nature: props.pet.nature || 0,
    exp: props.pet.exp || 0,
    hp: props.pet.hp || 0,
    maxHp: props.pet.maxHp || 0,
    atk: props.pet.atk || 0,
    def: props.pet.def || 0,
    spAtk: props.pet.spAtk || 0,
    spDef: props.pet.spDef || 0,
    speed: props.pet.speed || 0,
    evHp: props.pet.evHp || 0,
    evAtk: props.pet.evAtk || 0,
    evDef: props.pet.evDef || 0,
    evSpAtk: props.pet.evSpAtk || 0,
    evSpDef: props.pet.evSpDef || 0,
    evSpeed: props.pet.evSpeed || 0,
    dvHp: props.pet.dvHp || 0,
    dvAtk: props.pet.dvAtk || 0,
    dvDef: props.pet.dvDef || 0,
    dvSpAtk: props.pet.dvSpAtk || 0,
    dvSpDef: props.pet.dvSpDef || 0,
    dvSpeed: props.pet.dvSpeed || 0,
    skillArray: props.pet.skillArray ? JSON.parse(JSON.stringify(props.pet.skillArray)) : [],
    abilityId: (props.pet.effectList && props.pet.effectList.length > 0) ? (props.pet.effectList[0].itemId || props.pet.effectList[0].effectID) : 0
  }
  
  // 确保技能数组有4个槽位
  while (editForm.value.skillArray.length < 4) {
    editForm.value.skillArray.push({ id: 0, pp: 0, maxPp: 0 })
  }
  
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  selectedSkillId.value = 0
}

// 保存编辑
const saveEdit = async () => {
  try {
    if (!props.pet) return
    
    // 验证数据
    if (editForm.value.level < 1 || editForm.value.level > 100) {
      ElMessage.error('等级必须在1-100之间')
      return
    }
    
    // 检查玩家是否在线
    const isOnline = props.pet.isOnline || false
    
    // 如果玩家在线，显示确认对话框
    if (isOnline) {
      await ElMessageBox.confirm(
        '修改精灵属性后，玩家会被踢下线，需要重新登录才能看到变化。是否继续？',
        '确认修改',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    
    // 过滤掉空技能槽
    const skills = editForm.value.skillArray
      .filter((skill: any) => skill.id > 0)
      .map((skill: any) => skill.id)
    
    // 调用后端API保存
    const updateData = {
      uid: props.pet.userID,
      catchTime: props.pet.catchTime,
      level: editForm.value.level,
      nature: editForm.value.nature,
      exp: editForm.value.exp,
      hp: editForm.value.hp,
      maxHp: editForm.value.maxHp,
      atk: editForm.value.atk,
      def: editForm.value.def,
      spAtk: editForm.value.spAtk,
      spDef: editForm.value.spDef,
      speed: editForm.value.speed,
      evHp: editForm.value.evHp,
      evAtk: editForm.value.evAtk,
      evDef: editForm.value.evDef,
      evSpAtk: editForm.value.evSpAtk,
      evSpDef: editForm.value.evSpDef,
      evSpeed: editForm.value.evSpeed,
      dvHp: editForm.value.dvHp,
      dvAtk: editForm.value.dvAtk,
      dvDef: editForm.value.dvDef,
      dvSpAtk: editForm.value.dvSpAtk,
      dvSpDef: editForm.value.dvSpDef,
      dvSpeed: editForm.value.dvSpeed,
      skills: skills,
      effectList: editForm.value.abilityId > 0 ? [{ itemId: editForm.value.abilityId, status: 2, leftCount: -1, effectID: editForm.value.abilityId, args: '' }] : []
    }
    
    await gmApi.updatePet(updateData)
    
    // 如果玩家在线，踢下线
    if (isOnline) {
      try {
        await gmApi.kickPlayer(props.pet.userID, '精灵属性已修改，请重新登录')
        ElMessage.success('保存成功，玩家已被踢下线')
      } catch (kickError) {
        console.error('踢出玩家失败:', kickError)
        ElMessage.warning('保存成功，但踢出玩家失败')
      }
    } else {
      ElMessage.success('保存成功')
    }
    
    isEditing.value = false
    selectedSkillId.value = 0
    
    // 触发刷新
    emit('refresh')
  } catch (error: any) {
    // 用户取消操作
    if (error === 'cancel') {
      return
    }
    console.error('保存精灵数据失败:', error)
    ElMessage.error('保存失败: ' + (error as any).message)
  }
}

// 替换技能
const replaceSkill = (slotIndex: number) => {
  if (!selectedSkillId.value) {
    ElMessage.warning('请先选择要替换的技能')
    return
  }
  
  if (slotIndex < 0 || slotIndex >= 4) {
    ElMessage.error('技能槽位无效')
    return
  }
  
  // 替换技能
  editForm.value.skillArray[slotIndex] = {
    id: selectedSkillId.value,
    pp: 20, // 默认PP值
    maxPp: 20
  }
  
  ElMessage.success(`已替换技能${slotIndex + 1}`)
}

// 刷新精灵数据
const handleRefresh = async () => {
  refreshing.value = true
  try {
    emit('refresh')
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const handleClose = () => {
  visible.value = false
  isEditing.value = false
  selectedSkillId.value = 0
}
</script>

<style scoped>
/* 对话框内容区域滚动，与添加精灵对话框保持一致 */
.pet-detail-content {
  max-height: 65vh;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 16px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;
}

.skill-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.skill-id {
  color: #6b7280;
  font-size: 12px;
}

.skill-pp {
  color: #6b7280;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  font-size: 14px;
}

/* 技能编辑样式 */
.skill-edit-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-filter-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.skill-edit-layout {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  min-height: 300px;
}

.skill-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-title {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
}

/* 当前技能列 */
.current-skills .skill-slots {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-slot {
  padding: 12px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  min-height: 60px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.skill-slot.empty {
  border-style: dashed;
  background: #fafafa;
}

.skill-slot .skill-content {
  width: 100%;
}

.empty-slot {
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
  width: 100%;
}

/* 操作按钮列 */
.actions {
  justify-content: center;
  min-width: 120px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  flex: 1;
}

/* 全部技能列 */
.all-skills {
  flex: 1;
}

.selected-skill-preview {
  padding: 12px;
  background: #eff6ff;
  border: 2px solid #3b82f6;
  border-radius: 6px;
}

.selected-skill-preview .skill-info {
  justify-content: center;
}

/* 响应式 */
@media (max-width: 1200px) {
  .skill-edit-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .actions {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .action-buttons .el-button {
    flex: 1;
    min-width: 120px;
  }
}
</style>
