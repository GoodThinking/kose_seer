<template>
  <div class="players-page">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">玩家管理</h3>
          <el-input
            v-model="searchText"
            placeholder="搜索玩家ID或昵称"
            style="width: 300px"
            clearable
            @change="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <div class="p-6">
        <el-table :data="players" border stripe>
          <el-table-column prop="userID" label="UID" width="100" fixed="left" />
          <el-table-column prop="nick" label="昵称" width="150" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.isOnline ? 'success' : 'info'" size="small">
                {{ row.isOnline ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="coins" label="赛尔豆" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono">{{ row.coins?.toLocaleString() || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="energy" label="体力" width="100" align="center" />
          <el-table-column prop="allocatableExp" label="可分配经验" width="130" align="right">
            <template #default="{ row }">
              <span class="font-mono text-blue-600">{{ row.allocatableExp?.toLocaleString() || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="vipLevel" label="超能NoNo" width="120" align="center">
            <template #default="{ row }">
              <span class="font-mono">{{ row.vipLevel || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="petMaxLev" label="最高精灵等级" width="130" align="center" />
          <el-table-column prop="petAllNum" label="精灵总数" width="110" align="center" />
          <el-table-column prop="loginCnt" label="登录次数" width="110" align="center" />
          <el-table-column prop="regTime" label="注册时间" width="180">
            <template #default="{ row }">
              <span class="text-xs">{{ formatTime(row.regTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handleViewDetail(row)">详情</el-button>
              <el-button size="small" type="danger" @click="handleBan(row)">封禁</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadPlayers"
          @size-change="loadPlayers"
          style="margin-top: 20px; justify-content: center"
        />
      </div>
    </div>

    <!-- 玩家详情对话框 -->
    <el-dialog
      v-model="detailDialog"
      :title="`玩家详情 - ${currentPlayer?.nickname || ''} (${currentPlayer?.uid || ''})`"
      width="1200px"
      top="5vh"
    >
      <div v-if="currentPlayer" class="player-detail-content">
        <div class="detail-layout">
          <!-- 左侧：基础信息 -->
          <div class="detail-left">
            <!-- 账号管理 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Lock /></el-icon>
                  <span>账号管理</span>
                  <el-button 
                    size="small" 
                    type="warning" 
                    @click="handleEditAccountInDetail"
                    style="margin-left: auto"
                  >
                    <el-icon><Edit /></el-icon>
                    修改账号
                  </el-button>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="UID">{{ currentPlayer.uid }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ currentPlayer.email || '未设置' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 基本信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>基本信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="UID">{{ currentPlayer.uid }}</el-descriptions-item>
                <el-descriptions-item label="昵称">{{ currentPlayer.nickname }}</el-descriptions-item>
                <el-descriptions-item label="颜色">{{ currentPlayer.color }}</el-descriptions-item>
                <el-descriptions-item label="纹理">{{ currentPlayer.texture }}</el-descriptions-item>
                <el-descriptions-item label="登录次数">{{ currentPlayer.loginCount }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">{{ formatTime(currentPlayer.registerTime) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 货币与资源 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Coin /></el-icon>
                  <span>货币与资源</span>
                  <el-button 
                    v-if="!isEditingData" 
                    size="small" 
                    type="primary" 
                    @click="startEditData"
                    style="margin-left: auto"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <div v-else style="margin-left: auto; display: flex; gap: 8px;">
                    <el-button size="small" @click="cancelEditData">取消</el-button>
                    <el-button size="small" type="primary" @click="saveEditData">保存</el-button>
                  </div>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="赛尔豆">
                  <span v-if="!isEditingData">{{ currentPlayer.coins?.toLocaleString() || 0 }}</span>
                  <el-input-number 
                    v-else
                    v-model="editDataForm.coins" 
                    :min="0" 
                    :max="999999999"
                    :step="1000"
                    controls-position="right"
                    size="small"
                    style="width: 100%"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="体力">{{ currentPlayer.energy }}</el-descriptions-item>
                <el-descriptions-item label="战斗徽章">{{ currentPlayer.fightBadge }}</el-descriptions-item>
                <el-descriptions-item label="可分配经验">
                  <span v-if="!isEditingData">{{ currentPlayer.allocatableExp?.toLocaleString() || 0 }}</span>
                  <el-input-number 
                    v-else
                    v-model="editDataForm.allocatableExp" 
                    :min="0" 
                    :max="999999999"
                    :step="1000"
                    controls-position="right"
                    size="small"
                    style="width: 100%"
                  />
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 超能NoNo -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Star /></el-icon>
                  <span>超能NoNo</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="拥有NoNo">
                  <el-tag :type="currentPlayer.hasNono ? 'success' : 'info'" size="small">
                    {{ currentPlayer.hasNono ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="超级NoNo">
                  <el-tag :type="currentPlayer.superNono ? 'success' : 'info'" size="small">
                    {{ currentPlayer.superNono ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="NoNo昵称">{{ currentPlayer.nonoNick || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="NoNo颜色">{{ currentPlayer.nonoColor || 0 }}</el-descriptions-item>
                <el-descriptions-item label="NoNo体力">{{ currentPlayer.nonoPower || 0 }}</el-descriptions-item>
                <el-descriptions-item label="NoNo心情">{{ currentPlayer.nonoMate || 0 }}</el-descriptions-item>
                <el-descriptions-item label="超能NoNo等级">{{ currentPlayer.vipLevel || 0 }}</el-descriptions-item>
                <el-descriptions-item label="超能NoNo值">{{ currentPlayer.vipValue || 0 }}</el-descriptions-item>
                <el-descriptions-item label="超能NoNo阶段">{{ currentPlayer.vipStage || 0 }}</el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ currentPlayer.vipEndTime ? formatTime(currentPlayer.vipEndTime) : '未设置' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 战斗统计 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Trophy /></el-icon>
                  <span>战斗统计</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="王者之战胜利">{{ currentPlayer.monKingWin || 0 }}</el-descriptions-item>
                <el-descriptions-item label="混战胜利">{{ currentPlayer.messWin || 0 }}</el-descriptions-item>
                <el-descriptions-item label="竞技场最高连胜">{{ currentPlayer.maxArenaWins || 0 }}</el-descriptions-item>
                <el-descriptions-item label="当前关卡">{{ currentPlayer.curStage || 0 }}</el-descriptions-item>
                <el-descriptions-item label="最高关卡">{{ currentPlayer.maxStage || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 位置信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Location /></el-icon>
                  <span>位置信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="当前地图">{{ currentPlayer.mapId }}</el-descriptions-item>
                <el-descriptions-item label="坐标 X">{{ currentPlayer.posX || 0 }}</el-descriptions-item>
                <el-descriptions-item label="坐标 Y">{{ currentPlayer.posY || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 师徒信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>师徒信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="老师ID">{{ currentPlayer.teacherID || '无' }}</el-descriptions-item>
                <el-descriptions-item label="学生ID">{{ currentPlayer.studentID || '无' }}</el-descriptions-item>
                <el-descriptions-item label="毕业次数">{{ currentPlayer.graduationCount || 0 }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 其他信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><More /></el-icon>
                  <span>其他信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="今日在线时间">{{ Math.floor((currentPlayer.timeToday || 0) / 60) }} 分钟</el-descriptions-item>
                <el-descriptions-item label="时间限制">{{ currentPlayer.timeLimit || 0 }}</el-descriptions-item>
                <el-descriptions-item label="邀请者ID">{{ currentPlayer.inviter || '无' }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>

          <!-- 右侧：精灵、物品、任务 -->
          <div class="detail-right">
            <!-- 精灵信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Avatar /></el-icon>
                  <span>精灵信息 ({{ currentPlayer.petCount }} 只)</span>
                  <el-button 
                    size="small" 
                    type="success" 
                    @click="handleAddPet"
                    style="margin-left: auto"
                  >
                    <el-icon><Plus /></el-icon>
                    添加精灵
                  </el-button>
                </div>
              </template>
              <el-descriptions :column="2" border size="small" style="margin-bottom: 12px;">
                <el-descriptions-item label="精灵总数">{{ currentPlayer.petCount }}</el-descriptions-item>
                <el-descriptions-item label="最高精灵等级">{{ currentPlayer.petMaxLev }}</el-descriptions-item>
              </el-descriptions>
              <el-input
                v-model="petSearchText"
                placeholder="搜索精灵ID或名字..."
                clearable
                size="small"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="list-container">
                <div v-if="filteredPets.length === 0" class="empty-text">暂无匹配的精灵</div>
                <div v-else class="list-item clickable" v-for="pet in paginatedPets" :key="pet.catchTime" @click="handleViewPet(pet)">
                  <div class="list-item-main">
                    <span class="list-item-title">{{ getPetName(pet.id) }} (ID: {{ pet.id }}) Lv.{{ pet.level }}</span>
                    <span class="list-item-info">HP: {{ pet.hp }}/{{ pet.maxHp }} | 经验: {{ pet.exp }}</span>
                  </div>
                </div>
              </div>
              <!-- 精灵分页 -->
              <el-pagination
                v-if="filteredPets.length > petPageSize"
                v-model:current-page="petCurrentPage"
                :page-size="petPageSize"
                :total="filteredPets.length"
                layout="prev, pager, next, total"
                small
                style="margin-top: 12px; justify-content: center;"
              />
            </el-card>

            <!-- 物品信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>物品信息 ({{ currentPlayer.itemCount }} 个)</span>
                  <el-button 
                    size="small" 
                    type="success" 
                    @click="handleAddItem"
                    style="margin-left: auto"
                  >
                    <el-icon><Plus /></el-icon>
                    添加物品
                  </el-button>
                </div>
              </template>
              <el-input
                v-model="itemSearchText"
                placeholder="搜索物品ID或名字..."
                clearable
                size="small"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="list-container">
                <div v-if="filteredItems.length === 0" class="empty-text">暂无匹配的物品</div>
                <div v-else class="list-item" v-for="(item, index) in paginatedItems" :key="index">
                  <div class="list-item-main">
                    <span class="list-item-title">{{ getItemName(item.itemId) }} (ID: {{ item.itemId }})</span>
                    <span class="list-item-info">数量: {{ item.count }} {{ item.expireTime > 0 ? '(限时)' : '' }}</span>
                  </div>
                </div>
              </div>
              <!-- 物品分页 -->
              <el-pagination
                v-if="filteredItems.length > itemPageSize"
                v-model:current-page="itemCurrentPage"
                :page-size="itemPageSize"
                :total="filteredItems.length"
                layout="prev, pager, next, total"
                small
                style="margin-top: 12px; justify-content: center;"
              />
            </el-card>

            <!-- 任务信息 -->
            <el-card class="detail-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>任务信息 ({{ currentPlayer.taskCount }} 个)</span>
                </div>
              </template>
              <el-input
                v-model="taskSearchText"
                placeholder="搜索任务ID或名字..."
                clearable
                size="small"
                style="margin-bottom: 12px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <div class="list-container">
                <div v-if="filteredTasks.length === 0" class="empty-text">暂无匹配的任务</div>
                <div v-else class="list-item" v-for="(task, index) in filteredTasks.slice(0, 20)" :key="index">
                  <div class="list-item-main">
                    <span class="list-item-title">{{ getTaskName(task.taskId) }} (ID: {{ task.taskId }})</span>
                    <el-tag :type="getTaskStatusType(task.status)" size="small">
                      {{ getTaskStatusText(task.status) }}
                    </el-tag>
                  </div>
                </div>
                <div v-if="filteredTasks.length > 20" class="more-text">还有 {{ filteredTasks.length - 20 }} 个任务...</div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 修改账号对话框 -->
    <el-dialog v-model="editAccountDialog" title="修改账号信息" width="500px">
      <el-form :model="editAccountForm" label-width="100px">
        <el-form-item label="UID">
          <el-input v-model="editAccountForm.uid" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editAccountForm.nickname" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editAccountForm.email" placeholder="请输入新邮箱（留空则不修改）" clearable />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="editAccountForm.password" type="password" placeholder="请输入新密码（留空则不修改）" clearable show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="editAccountForm.confirmPassword" type="password" placeholder="请再次输入新密码" clearable show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editAccountDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditAccount">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑玩家数据对话框 -->
    <el-dialog v-model="editPlayerDataDialog" title="编辑玩家数据" width="500px">
      <el-form :model="editPlayerDataForm" label-width="120px">
        <el-form-item label="UID">
          <el-input v-model="editPlayerDataForm.uid" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editPlayerDataForm.nickname" disabled />
        </el-form-item>
        <el-form-item label="赛尔豆">
          <el-input-number 
            v-model="editPlayerDataForm.coins" 
            :min="0" 
            :max="999999999"
            :step="1000"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="可分配经验">
          <el-input-number 
            v-model="editPlayerDataForm.allocatableExp" 
            :min="0" 
            :max="999999999"
            :step="1000"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editPlayerDataDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditPlayerData">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加精灵对话框 -->
    <el-dialog v-model="addPetDialog" title="添加精灵" width="900px">
      <el-form :model="addPetForm" label-width="80px" class="add-pet-form">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-title">基础信息</div>
          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="精灵">
                <PaginatedSelect
                  v-model="addPetForm.petId"
                  placeholder="请选择精灵"
                  :fetch-data="fetchPetData"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="等级">
                <el-input-number 
                  v-model="addPetForm.level" 
                  :min="1" 
                  :max="100"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 高级选项按钮 -->
        <div style="margin-bottom: 16px;">
          <el-button 
            type="info" 
            plain 
            size="small"
            @click="showAdvancedOptions = !showAdvancedOptions"
          >
            <el-icon><Setting /></el-icon>
            {{ showAdvancedOptions ? '隐藏高级选项' : '显示高级选项' }}
          </el-button>
        </div>

        <!-- 高级选项区域 -->
        <el-collapse-transition>
          <div v-show="showAdvancedOptions" class="advanced-options">
            <!-- 个体值 -->
            <div class="form-section">
              <div class="section-title">个体值 (DV/IV)</div>
              <el-row :gutter="12">
                <el-col :span="4">
                  <el-form-item label="HP" label-width="40px">
                    <el-input-number v-model="addPetForm.dvHp" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="攻击" label-width="40px">
                    <el-input-number v-model="addPetForm.dvAtk" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="防御" label-width="40px">
                    <el-input-number v-model="addPetForm.dvDef" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="特攻" label-width="40px">
                    <el-input-number v-model="addPetForm.dvSpAtk" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="特防" label-width="40px">
                    <el-input-number v-model="addPetForm.dvSpDef" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="速度" label-width="40px">
                    <el-input-number v-model="addPetForm.dvSpeed" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="button-group">
                <el-button class="action-button" type="primary" size="small" @click="randomizeDV">随机个体值</el-button>
                <el-button class="action-button" type="success" size="small" @click="maxDV">满个体值</el-button>
              </div>
            </div>

            <!-- 努力值 -->
            <div class="form-section">
              <div class="section-title">努力值 (EV)</div>
              <el-row :gutter="12">
                <el-col :span="4">
                  <el-form-item label="HP" label-width="40px">
                    <el-input-number v-model="addPetForm.evHp" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="攻击" label-width="40px">
                    <el-input-number v-model="addPetForm.evAtk" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="防御" label-width="40px">
                    <el-input-number v-model="addPetForm.evDef" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="特攻" label-width="40px">
                    <el-input-number v-model="addPetForm.evSpAtk" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="特防" label-width="40px">
                    <el-input-number v-model="addPetForm.evSpDef" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="速度" label-width="40px">
                    <el-input-number v-model="addPetForm.evSpeed" :min="0" size="small" style="width: 100%" controls-position="right" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="button-group">
                <el-button class="action-button" type="warning" size="small" @click="clearEV">清空努力值</el-button>
              </div>
            </div>

            <!-- 性格 -->
            <div class="form-section">
              <div class="section-title">性格</div>
              <el-form-item label="性格" label-width="80px">
                <el-select 
                  v-model="addPetForm.nature" 
                  filterable 
                  placeholder="选择性格"
                  style="width: 300px"
                >
                  <el-option
                    v-for="nature in natureOptions"
                    :key="nature.id"
                    :label="`${nature.id} - ${nature.name}`"
                    :value="nature.id"
                  >
                    <span>{{ nature.id }} - {{ nature.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 12px; margin-left: 10px;">{{ nature.category }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </div>

            <!-- 技能 -->
            <div class="form-section">
              <div class="section-title">技能（最多4个）</div>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="技能1" label-width="60px">
                    <PaginatedSelect
                      v-model="addPetForm.skill1"
                      placeholder="选择技能"
                      :fetch-data="fetchSkillData"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="技能2" label-width="60px">
                    <PaginatedSelect
                      v-model="addPetForm.skill2"
                      placeholder="选择技能"
                      :fetch-data="fetchSkillData"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="技能3" label-width="60px">
                    <PaginatedSelect
                      v-model="addPetForm.skill3"
                      placeholder="选择技能"
                      :fetch-data="fetchSkillData"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="技能4" label-width="60px">
                    <PaginatedSelect
                      v-model="addPetForm.skill4"
                      placeholder="选择技能"
                      :fetch-data="fetchSkillData"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <!-- 特性 -->
            <div class="form-section">
              <div class="section-title">特性（每个精灵只能拥有一个）</div>
              <el-row :gutter="12">
                <el-col :span="18">
                  <el-form-item label="特性" label-width="80px">
                    <PaginatedSelect
                      v-model="addPetForm.abilityId"
                      placeholder="无特性"
                      :fetch-data="fetchAbilityData"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-button size="small" @click="addPetForm.abilityId = 0">清除特性</el-button>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-collapse-transition>
      </el-form>
      <template #footer>
        <el-button @click="addPetDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddPet">确定</el-button>
      </template>
    </el-dialog>

    <!-- 精灵详情对话框 -->
    <PetDetailDialog
      v-model="petDetailDialog"
      :pet="currentPet"
      @edit="handleEditPet"
      @refresh="handleRefreshPetDetail"
    />

    <!-- 添加物品对话框 -->
    <el-dialog v-model="addItemDialog" title="添加物品" width="600px">
      <el-form :model="addItemForm" label-width="80px">
        <!-- 物品选择 -->
        <el-form-item label="物品">
          <PaginatedSelect
            v-model="addItemForm.itemId"
            placeholder="选择物品"
            :fetch-data="fetchItemData"
          />
        </el-form-item>

        <!-- 数量 -->
        <el-form-item label="数量">
          <el-input-number
            v-model="addItemForm.count"
            :min="1"
            :max="999999"
            :step="1"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 时效 -->
        <el-form-item label="时效">
          <el-radio-group v-model="addItemForm.expireType">
            <el-radio :label="0">永久</el-radio>
            <el-radio :label="1">限时</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 限时天数 -->
        <el-form-item v-if="addItemForm.expireType === 1" label="天数">
          <el-input-number
            v-model="addItemForm.expireDays"
            :min="1"
            :max="365"
            :step="1"
            controls-position="right"
            style="width: 100%"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            物品将在 {{ addItemForm.expireDays }} 天后过期
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addItemDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddItem">确定</el-button>
      </template>
    </el-dialog>

    <!-- 封禁管理对话框 -->
    <el-dialog
      v-model="banDialog"
      :title="`封禁管理 - ${banPlayerInfo?.nick || ''} (${banPlayerInfo?.userID || ''})`"
      width="520px"
      :close-on-click-modal="false"
    >
      <div class="ban-dialog-content">
        <!-- 封禁类型选择 -->
        <div class="ban-section">
          <div class="ban-label">封禁类型</div>
          <div class="ban-radio-group">
            <label 
              v-for="option in banOptions" 
              :key="option.value"
              :class="['ban-radio', { 'is-checked': banForm.banType === option.value }]"
              @click="banForm.banType = option.value"
            >
              <input 
                type="radio" 
                name="banType"
                :checked="banForm.banType === option.value"
              />
              <div style="flex: 1;">
                <div class="ban-radio-label">{{ option.label }}</div>
                <div class="ban-radio-desc">{{ option.desc }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 封禁原因输入 -->
        <div class="ban-section">
          <div class="ban-label">封禁原因（可选）</div>
          <el-input
            v-model="banForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入封禁原因，如：恶意刷屏、使用外挂等"
            maxlength="200"
            show-word-limit
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="banDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBan" :loading="banLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, User, Coin, Avatar, Box, Document, Star, Trophy, Location, More, Edit, Lock, Plus, Setting } from '@element-plus/icons-vue'
import { gmApi } from '@/api/gm'
import { configApi } from '@/api/config'
import { useConfigStore } from '@/stores/config'
import PetDetailDialog from '@/components/PetDetailDialog.vue'
import PaginatedSelect from '@/components/PaginatedSelect.vue'

const configStore = useConfigStore()

const players = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)

// 封禁对话框相关
const banDialog = ref(false)
const banPlayerInfo = ref<any>(null)
const banLoading = ref(false)
const banForm = ref({
  banType: 1,
  reason: ''
})

const banOptions = [
  { value: 1, label: '24小时封停', desc: '临时封禁，适用于轻微违规' },
  { value: 2, label: '7天封停', desc: '短期封禁，适用于一般违规' },
  { value: 3, label: '14天封停', desc: '中期封禁，适用于严重违规' },
  { value: 4, label: '永久封停', desc: '永久封禁，适用于极其严重违规' },
  { value: 0, label: '解除封禁', desc: '恢复账号正常状态' }
]
const pageSize = ref(20)
const searchText = ref('')

// 修改账号对话框
const editAccountDialog = ref(false)
const editAccountForm = ref({
  uid: 0,
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 编辑玩家数据对话框
const editPlayerDataDialog = ref(false)
const editPlayerDataForm = ref({
  uid: 0,
  nickname: '',
  coins: 0,
  allocatableExp: 0
})

// 添加精灵对话框
const addPetDialog = ref(false)
const addPetForm = ref({
  petId: 0,
  level: 1,
  // 个体值 (DV/IV)
  dvHp: 15,
  dvAtk: 15,
  dvDef: 15,
  dvSpAtk: 15,
  dvSpDef: 15,
  dvSpeed: 15,
  // 努力值 (EV)
  evHp: 0,
  evAtk: 0,
  evDef: 0,
  evSpAtk: 0,
  evSpDef: 0,
  evSpeed: 0,
  // 性格
  nature: 1,
  // 技能
  skill1: 0,
  skill2: 0,
  skill3: 0,
  skill4: 0,
  // 特性（只能一个，0=无特性）
  abilityId: 0
})
const natureOptions = ref<any[]>([])
const showAdvancedOptions = ref(false)

// 获取精灵数据（用于分页选择器）
const fetchPetData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchPets(query, page, pageSize) as any
  return res.data || res
}

// 获取技能数据（用于分页选择器）
const fetchSkillData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchSkills(query, page, pageSize) as any
  return res.data || res
}

// 获取物品数据（用于分页选择器）
const fetchItemData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchItems(query, page, pageSize) as any
  return res.data || res
}

// 获取特性数据（用于分页选择器）
const fetchAbilityData = async (query: string, page: number, pageSize: number) => {
  const res = await configApi.searchAbilities(query, page, pageSize) as any
  return res.data || res
}

// 在线编辑数据状态
const isEditingData = ref(false)
const editDataForm = ref({
  coins: 0,
  allocatableExp: 0
})

// 详情对话框
const detailDialog = ref(false)
const currentPlayer = ref<any>(null)
const petSearchText = ref('')
const petCurrentPage = ref(1)
const petPageSize = ref(20)
const itemSearchText = ref('')
const itemCurrentPage = ref(1)
const itemPageSize = ref(20)
const taskSearchText = ref('')

// 精灵详情对话框
const petDetailDialog = ref(false)
const currentPet = ref<any>(null)

// 添加物品对话框
const addItemDialog = ref(false)
const addItemForm = ref({
  itemId: 0,
  count: 1,
  expireType: 0, // 0=永久, 1=限时
  expireDays: 7
})

// 格式化时间戳
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
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

// 获取精灵名字
const getPetName = (petId: number) => {
  return configStore.petNames[petId] || '未知精灵'
}

// 获取物品名字
const getItemName = (itemId: number) => {
  return configStore.itemNames[itemId] || '未知物品'
}

// 获取任务名字
const getTaskName = (taskId: number) => {
  return configStore.taskNames[taskId] || '未知任务'
}

// 获取任务状态文本
const getTaskStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: '已接受',
    2: '进行中',
    3: '已完成'
  }
  return statusMap[status] || '未接取'
}

// 获取任务状态类型
const getTaskStatusType = (status: number) => {
  const typeMap: Record<number, any> = {
    1: 'info',
    2: 'warning',
    3: 'success'
  }
  return typeMap[status] || 'info'
}

// 过滤精灵列表
const filteredPets = computed(() => {
  if (!currentPlayer.value?.pets) return []
  if (!petSearchText.value) return currentPlayer.value.pets
  
  const lowerSearch = petSearchText.value.toLowerCase()
  return currentPlayer.value.pets.filter((pet: any) => {
    const petName = getPetName(pet.id)
    return pet.id.toString().includes(petSearchText.value) || 
           petName.toLowerCase().includes(lowerSearch)
  })
})

// 分页精灵列表
const paginatedPets = computed(() => {
  const start = (petCurrentPage.value - 1) * petPageSize.value
  const end = start + petPageSize.value
  return filteredPets.value.slice(start, end)
})

// 监听搜索文本变化，重置页码
watch(petSearchText, () => {
  petCurrentPage.value = 1
})

// 过滤物品列表
const filteredItems = computed(() => {
  if (!currentPlayer.value?.items) return []
  if (!itemSearchText.value) return currentPlayer.value.items
  
  const lowerSearch = itemSearchText.value.toLowerCase()
  return currentPlayer.value.items.filter((item: any) => {
    const itemName = getItemName(item.itemId)
    return item.itemId.toString().includes(itemSearchText.value) || 
           itemName.toLowerCase().includes(lowerSearch)
  })
})

// 分页物品列表
const paginatedItems = computed(() => {
  const start = (itemCurrentPage.value - 1) * itemPageSize.value
  const end = start + itemPageSize.value
  return filteredItems.value.slice(start, end)
})

// 监听搜索文本变化，重置页码
watch(itemSearchText, () => {
  itemCurrentPage.value = 1
})

// 过滤任务列表
const filteredTasks = computed(() => {
  if (!currentPlayer.value?.tasks) return []
  if (!taskSearchText.value) return currentPlayer.value.tasks
  
  const lowerSearch = taskSearchText.value.toLowerCase()
  return currentPlayer.value.tasks.filter((task: any) => {
    const taskName = getTaskName(task.taskId)
    return task.taskId.toString().includes(taskSearchText.value) || 
           taskName.toLowerCase().includes(lowerSearch)
  })
})

// 查看精灵详情
const handleViewPet = (pet: any) => {
  // 添加玩家的在线状态到精灵对象
  currentPet.value = {
    ...pet,
    isOnline: currentPlayer.value?.isOnline || false
  }
  petDetailDialog.value = true
}

// 编辑精灵
const handleEditPet = (_pet: any) => {
  // 编辑功能已在 PetDetailDialog 组件内部实现
}

// 刷新精灵详情
const handleRefreshPetDetail = async () => {
  if (!currentPlayer.value || !currentPet.value) return
  
  try {
    // 重新加载玩家详情
    const detailRes = await gmApi.getPlayerDetail(currentPlayer.value.uid) as any
    if (detailRes.success) {
      currentPlayer.value = detailRes.data
      
      // 更新当前精灵数据
      const updatedPet = currentPlayer.value.pets?.find(
        (p: any) => p.catchTime === currentPet.value.catchTime
      )
      if (updatedPet) {
        // 保留 isOnline 状态
        updatedPet.isOnline = currentPlayer.value.isOnline || false
        currentPet.value = updatedPet
      }
      
      ElMessage.success('精灵数据已刷新')
    }
  } catch (error) {
    console.error('刷新精灵数据失败:', error)
    ElMessage.error('刷新失败')
  }
}

// 打开添加精灵对话框
const handleAddPet = async () => {
  if (!currentPlayer.value) return
  
  // 加载性格选项
  if (natureOptions.value.length === 0) {
    const naturesData = await configStore.fetchConfig('natures') as any
    natureOptions.value = naturesData.natures || []
  }
  
  // 重置表单（默认中等个体值）
  addPetForm.value = {
    petId: 0,
    level: 1,
    // 个体值默认15（中等）
    dvHp: 15,
    dvAtk: 15,
    dvDef: 15,
    dvSpAtk: 15,
    dvSpDef: 15,
    dvSpeed: 15,
    // 努力值默认0
    evHp: 0,
    evAtk: 0,
    evDef: 0,
    evSpAtk: 0,
    evSpDef: 0,
    evSpeed: 0,
    // 性格默认1（孤独）
    nature: 1,
    // 技能默认0（自动分配）
    skill1: 0,
    skill2: 0,
    skill3: 0,
    skill4: 0,
    // 特性
    abilityId: 0
  }
  
  showAdvancedOptions.value = false
  addPetDialog.value = true
}

// 随机个体值
const randomizeDV = () => {
  addPetForm.value.dvHp = Math.floor(Math.random() * 32)
  addPetForm.value.dvAtk = Math.floor(Math.random() * 32)
  addPetForm.value.dvDef = Math.floor(Math.random() * 32)
  addPetForm.value.dvSpAtk = Math.floor(Math.random() * 32)
  addPetForm.value.dvSpDef = Math.floor(Math.random() * 32)
  addPetForm.value.dvSpeed = Math.floor(Math.random() * 32)
  ElMessage.success('已随机生成个体值')
}

// 满个体值
const maxDV = () => {
  addPetForm.value.dvHp = 31
  addPetForm.value.dvAtk = 31
  addPetForm.value.dvDef = 31
  addPetForm.value.dvSpAtk = 31
  addPetForm.value.dvSpDef = 31
  addPetForm.value.dvSpeed = 31
  ElMessage.success('已设置为满个体值')
}

// 清空努力值
const clearEV = () => {
  addPetForm.value.evHp = 0
  addPetForm.value.evAtk = 0
  addPetForm.value.evDef = 0
  addPetForm.value.evSpAtk = 0
  addPetForm.value.evSpDef = 0
  addPetForm.value.evSpeed = 0
  ElMessage.success('已清空努力值')
}

// 添加特性
// 确认添加精灵
const confirmAddPet = async () => {
  try {
    if (!currentPlayer.value) return
    
    if (!addPetForm.value.petId) {
      ElMessage.warning('请选择精灵')
      return
    }
    
    // 准备自定义属性（如果显示了高级选项）
    const customStats = showAdvancedOptions.value ? {
      dvHp: addPetForm.value.dvHp,
      dvAtk: addPetForm.value.dvAtk,
      dvDef: addPetForm.value.dvDef,
      dvSpAtk: addPetForm.value.dvSpAtk,
      dvSpDef: addPetForm.value.dvSpDef,
      dvSpeed: addPetForm.value.dvSpeed,
      evHp: addPetForm.value.evHp,
      evAtk: addPetForm.value.evAtk,
      evDef: addPetForm.value.evDef,
      evSpAtk: addPetForm.value.evSpAtk,
      evSpDef: addPetForm.value.evSpDef,
      evSpeed: addPetForm.value.evSpeed,
      nature: addPetForm.value.nature,
      // 自定义技能（过滤掉0值）
      skills: [
        addPetForm.value.skill1,
        addPetForm.value.skill2,
        addPetForm.value.skill3,
        addPetForm.value.skill4
      ].filter(s => s > 0),
      // 特性（单个）
      effectList: addPetForm.value.abilityId > 0 ? [{ itemId: addPetForm.value.abilityId, status: 2, leftCount: -1, effectID: addPetForm.value.abilityId, args: '' }] : undefined
    } : undefined
    
    // 检查是否选择了自定义技能
    if (customStats?.skills && customStats.skills.length > 0) {
      // 显示警告提示（不需要获取技能名称，直接显示ID）
      try {
        await ElMessageBox.confirm(
          `你选择了 ${customStats.skills.length} 个自定义技能（ID: ${customStats.skills.join(', ')}）\n\n注意：这些技能可能不是该精灵的默认技能。\n是否继续添加？`,
          '自定义技能警告',
          {
            confirmButtonText: '继续添加',
            cancelButtonText: '取消',
            type: 'warning',
            distinguishCancelAndClose: true
          }
        )
      } catch (error) {
        // 用户点击取消
        return
      }
    }
    
    const res = await gmApi.givePet(
      currentPlayer.value.uid,
      addPetForm.value.petId,
      addPetForm.value.level,
      false,  // 不使用闪光
      customStats
    ) as any
    
    if (res.success) {
      ElMessage.success('精灵添加成功')
      addPetDialog.value = false
      
      // 刷新详情数据
      const detailRes = await gmApi.getPlayerDetail(currentPlayer.value.uid) as any
      if (detailRes.success) {
        currentPlayer.value = detailRes.data
      }
      
      loadPlayers()
    } else {
      ElMessage.error(res.error || '添加精灵失败')
    }
  } catch (error: any) {
    console.error('添加精灵失败:', error)
    ElMessage.error(error.message || '添加精灵失败')
  }
}

const loadPlayers = async () => {
  try {
    const res = await gmApi.getPlayers({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchText.value
    }) as any
    
    if (res.success) {
      players.value = res.data.players
      total.value = res.data.total
    } else {
      ElMessage.error(res.error || '加载玩家列表失败')
    }
  } catch (error) {
    console.error('加载玩家列表失败:', error)
    ElMessage.error('加载玩家列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadPlayers()
}

// 打开添加物品对话框
const handleAddItem = () => {
  if (!currentPlayer.value) return
  
  // 重置表单
  addItemForm.value = {
    itemId: 0,
    count: 1,
    expireType: 0,
    expireDays: 7
  }
  
  addItemDialog.value = true
}

// 确认添加物品
const confirmAddItem = async () => {
  try {
    if (!currentPlayer.value) return
    
    // 验证
    if (!addItemForm.value.itemId) {
      ElMessage.error('请选择物品')
      return
    }
    
    if (addItemForm.value.count < 1) {
      ElMessage.error('数量必须大于0')
      return
    }
    
    // 计算过期时间（秒）
    let expireTime = 0
    if (addItemForm.value.expireType === 1) {
      expireTime = addItemForm.value.expireDays * 24 * 60 * 60
    }
    
    const res = await gmApi.giveItem(
      currentPlayer.value.uid,
      addItemForm.value.itemId,
      addItemForm.value.count,
      expireTime
    ) as any
    
    if (res.success) {
      ElMessage.success('物品添加成功')
      addItemDialog.value = false
      
      // 刷新玩家详情
      const detailRes = await gmApi.getPlayerDetail(currentPlayer.value.uid) as any
      if (detailRes.success) {
        currentPlayer.value = detailRes.data
      }
    }
  } catch (error) {
    console.error('添加物品失败:', error)
    ElMessage.error('添加物品失败: ' + (error as any).message)
  }
}

const handleViewDetail = async (row: any) => {
  try {
    const loading = ElMessage({
      message: '加载玩家详情...',
      type: 'info',
      duration: 0
    })
    
    const [detailRes] = await Promise.all([
      gmApi.getPlayerDetail(row.userID),
      configStore.fetchPetNames(),
      configStore.fetchItemNames(),
      configStore.fetchTaskNames()
    ])
    
    loading.close()
    
    const res = detailRes as any
    if (!res.success) {
      ElMessage.error(res.error || '获取玩家详情失败')
      return
    }
    
    currentPlayer.value = res.data
    petSearchText.value = ''
    itemSearchText.value = ''
    taskSearchText.value = ''
    isEditingData.value = false  // 重置编辑状态
    detailDialog.value = true
  } catch (error) {
    console.error('显示玩家详情失败:', error)
    ElMessage.error('显示玩家详情失败')
  }
}

// 在详情页中打开修改账号对话框
const handleEditAccountInDetail = () => {
  if (!currentPlayer.value) return
  
  editAccountForm.value = {
    uid: currentPlayer.value.uid,
    nickname: currentPlayer.value.nickname,
    email: '',
    password: '',
    confirmPassword: ''
  }
  editAccountDialog.value = true
}

// 开始在线编辑数据
const startEditData = () => {
  if (!currentPlayer.value) return
  
  editDataForm.value = {
    coins: currentPlayer.value.coins || 0,
    allocatableExp: currentPlayer.value.allocatableExp || 0
  }
  isEditingData.value = true
}

// 取消在线编辑
const cancelEditData = () => {
  isEditingData.value = false
  editDataForm.value = {
    coins: 0,
    allocatableExp: 0
  }
}

// 保存在线编辑的数据
const saveEditData = async () => {
  try {
    if (!currentPlayer.value) return
    
    const uid = currentPlayer.value.uid
    let hasChanges = false
    
    // 更新赛尔豆
    if (editDataForm.value.coins !== currentPlayer.value.coins) {
      const coinsRes = await gmApi.updatePlayer(uid, 'coins', editDataForm.value.coins) as any
      if (!coinsRes.success) {
        ElMessage.error(coinsRes.error || '修改赛尔豆失败')
        return
      }
      hasChanges = true
    }
    
    // 更新可分配经验
    if (editDataForm.value.allocatableExp !== currentPlayer.value.allocatableExp) {
      const expRes = await gmApi.updatePlayer(uid, 'allocatableExp', editDataForm.value.allocatableExp) as any
      if (!expRes.success) {
        ElMessage.error(expRes.error || '修改可分配经验失败')
        return
      }
      hasChanges = true
    }
    
    if (hasChanges) {
      ElMessage.success('数据修改成功')
      
      // 刷新详情数据
      const detailRes = await gmApi.getPlayerDetail(uid) as any
      if (detailRes.success) {
        currentPlayer.value = detailRes.data
      }
      
      loadPlayers()
    } else {
      ElMessage.info('没有修改任何数据')
    }
    
    isEditingData.value = false
  } catch (error: any) {
    console.error('修改玩家数据失败:', error)
    ElMessage.error(error.message || '修改玩家数据失败')
  }
}

const confirmEditAccount = async () => {
  try {
    // 验证输入
    if (!editAccountForm.value.email && !editAccountForm.value.password) {
      ElMessage.warning('请至少填写一项需要修改的内容')
      return
    }

    if (editAccountForm.value.password) {
      if (editAccountForm.value.password !== editAccountForm.value.confirmPassword) {
        ElMessage.error('两次输入的密码不一致')
        return
      }
      if (editAccountForm.value.password.length < 6) {
        ElMessage.error('密码长度至少为6位')
        return
      }
    }

    if (editAccountForm.value.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editAccountForm.value.email)) {
        ElMessage.error('邮箱格式不正确')
        return
      }
    }

    // 调用API
    const res = await gmApi.updateAccount(
      editAccountForm.value.uid,
      editAccountForm.value.email || undefined,
      editAccountForm.value.password || undefined
    ) as any

    if (res.success) {
      ElMessage.success('账号信息修改成功')
      editAccountDialog.value = false
      
      // 如果详情对话框打开，刷新详情数据
      if (detailDialog.value && currentPlayer.value) {
        const detailRes = await gmApi.getPlayerDetail(currentPlayer.value.uid) as any
        if (detailRes.success) {
          currentPlayer.value = detailRes.data
        }
      }
      
      loadPlayers()
    } else {
      ElMessage.error(res.error || '修改失败')
    }
  } catch (error: any) {
    console.error('修改账号信息失败:', error)
    ElMessage.error(error.message || '修改账号信息失败')
  }
}

// 确认编辑玩家数据
const confirmEditPlayerData = async () => {
  try {
    const uid = editPlayerDataForm.value.uid
    
    // 更新赛尔豆
    if (editPlayerDataForm.value.coins !== currentPlayer.value.coins) {
      const coinsRes = await gmApi.updatePlayer(uid, 'coins', editPlayerDataForm.value.coins) as any
      if (!coinsRes.success) {
        ElMessage.error(coinsRes.error || '修改赛尔豆失败')
        return
      }
    }
    
    // 更新可分配经验
    if (editPlayerDataForm.value.allocatableExp !== currentPlayer.value.allocatableExp) {
      const expRes = await gmApi.updatePlayer(uid, 'allocatableExp', editPlayerDataForm.value.allocatableExp) as any
      if (!expRes.success) {
        ElMessage.error(expRes.error || '修改可分配经验失败')
        return
      }
    }
    
    ElMessage.success('玩家数据修改成功')
    editPlayerDataDialog.value = false
    
    // 刷新详情数据
    const detailRes = await gmApi.getPlayerDetail(uid) as any
    if (detailRes.success) {
      currentPlayer.value = detailRes.data
    }
    
    loadPlayers()
  } catch (error: any) {
    console.error('修改玩家数据失败:', error)
    ElMessage.error(error.message || '修改玩家数据失败')
  }
}

const handleBan = (row: any) => {
  banPlayerInfo.value = row
  banForm.value = {
    banType: 1,
    reason: ''
  }
  banDialog.value = true
}

const confirmBan = async () => {
  try {
    banLoading.value = true
    
    const banType = banForm.value.banType
    const reason = banForm.value.reason || '无'
    
    await gmApi.banPlayer(banPlayerInfo.value.userID, banType, reason)
    
    const banTypeNames: { [key: number]: string } = {
      0: '解封',
      1: '24小时封停',
      2: '7天封停',
      3: '14天封停',
      4: '永久封停'
    }
    
    ElMessage.success(`玩家已${banTypeNames[banType]}`)
    
    banDialog.value = false
    loadPlayers()
  } catch (error: any) {
    ElMessage.error('操作失败: ' + (error.message || error))
  } finally {
    banLoading.value = false
  }
}

loadPlayers()
</script>


<style scoped>
.player-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-left,
.detail-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  width: 100%;
}

.card-header .el-button {
  margin-left: auto;
}

.list-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
}

.list-item {
  padding: 8px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background-color: #f9fafb;
}

.list-item.clickable {
  cursor: pointer;
}

.list-item.clickable:hover {
  background-color: #f3f4f6;
  border-left: 3px solid #2563eb;
}

.list-item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.list-item-title {
  font-weight: 500;
  color: #1f2937;
  flex: 1;
}

.list-item-info {
  color: #6b7280;
  font-size: 13px;
}

.empty-text {
  text-align: center;
  color: #9ca3af;
  padding: 40px 20px;
  font-size: 14px;
}

.more-text {
  text-align: center;
  color: #9ca3af;
  padding: 8px;
  font-size: 13px;
  border-top: 1px solid #f3f4f6;
  margin-top: 8px;
}

/* 添加精灵对话框样式 */
.add-pet-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-button {
  color: white !important;
}

.action-button.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.action-button.el-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
}

.action-button.el-button--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
}

.advanced-options {
  padding: 0;
}

/* 封禁对话框样式 */
.ban-dialog-content {
  padding: 8px 0;
}

.ban-section {
  margin-bottom: 24px;
}

.ban-section:last-child {
  margin-bottom: 0;
}

.ban-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.ban-label::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  background-color: #409eff;
  margin-right: 8px;
  border-radius: 2px;
}

.ban-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ban-radio {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
  background-color: #fff;
}

.ban-radio:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.ban-radio.is-checked {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.ban-radio input[type="radio"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.ban-radio-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.ban-radio-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.ban-radio.is-checked .ban-radio-label {
  color: #409eff;
}

.ban-radio.is-checked .ban-radio-desc {
  color: #79bbff;
}
</style>
