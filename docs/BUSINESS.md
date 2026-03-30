# 模型 & 关系 & 业务 设计

此文档以核心模型层的设计为基础，讲述此系统中的业务逻辑。由于此系统大部分内容都是记录类的业务驱动内容，外加少量的动态变化任务，因此适合围绕模型层展开描述。

1. 所有模型层实际定义可参考`schema.prisma`文件、`schemas`目录下各文件的Model部分(例如代码中实际会用到的字段类型)、`constants`下的部分常量定义(例如部分不在prisma中定义的枚举)。
2. 除必要外，以下字段讲解不包含类型定义，仅对字段进行说明以及对模型包含的业务进行说明。
3. model字段可空 & form字段可选是两回事。form字段可选可能表示此字段有默认值，在service层处理；model字段可空则是它是NULLABLE的

## Project 项目

Project是此系统中要记录以及处理的核心业务项。实际业务中不存在抽象的Project，而是具体的内容(ANIME 动画, GAME 游戏, MOVIE 电影, NOVEL 小说, MANGA 漫画)。这些项因为大部分的内容字段都相同，仅有部分独特字段，因此集合到一个表中，仅将独特字段作可选处理。

以下是所有Project的公有字段:
* `id`: 唯一ID，主键，在数据库层自动生成nanoid
* `title`: 标题
* `subtitles`: 其他标题 (db层面使用string保存，使用`|`作为分隔符)(form可选，默认空字符串)
* `description`: 描述 (form可选，默认空字符串)
* `keywords`: 关键词 (db层面使用string保存，使用`|`作为分隔符)(form可选，默认空字符串)
* `type`: 项目类型，即具体内容的类型 (必选且无默认值，但不出现在表单里，而是根据具体service来写)
* `publishTime`: 此项目的发布时间 (内容为`YYYY-MM`格式的字符串)(form可选，model可空)
* `ratinsS`: 分级(性) (db层面使用int保存，业务上则为枚举字符串)(form可选，model可空)
* `ratinsV`: 分级(暴力) (db层面使用int保存，业务上则为枚举字符串)(form可选，model可空)
* `region`: 地区 (db层面使用string保存，业务上使用枚举字符串)(form可选，model可空)
* `reations`, `relationsTopology`: 项目间关系；
    - 它使用`{"TYPE1": [idX, idY, ...], "TYPE2": ...}`的JSON结构来保存当前项目与哪些项目有关联。TYPE为关联类型，数组内为关联的项目的ID。
    - relations会自动计算拓扑，将关系网扩展到每一个有关系的项目。有关relations如何生成的已经在相关函数中实现了完善的算法。
    - 两个字段的区别: relations保存的是用户在当前项目中手动编写的关系内容，而relationsTopology保存的是拓扑后的完整关系网。用户在编辑页面看到的和保存的将是手动内容，而拓扑后的关系网在非编辑模式下的可视页面展示。
    - reations在form可选，在编辑时将relations作为一个完整字段提交，不会只编辑其中的单个类型；在model则必定保存为一个`{}`JSON Object，没有的类型字段可以不出现。
* `resources`: 项目资源；
    - 它使用`{"RESOURCE_NAME": ...}`的JSON结构来保存当前项目引用的外部资源。
    - 现阶段通常会有的字段一般是引用的封面文件(例如`cover`, `avatar`)；保存的是一个URL字符串，通过resources API来获取此实际资源。
    - 资源不是一个可以在表单中编辑的字段；在model必定保存为一个`{}` JSON Object，没有的字段可以不出现。
* `createTime`, `updateTime`: 项目创建时间与更新时间 (不可空，会在创建以及修改时在service层更新)
* `creator`, `updator`: 项目创建者与修改者ID (不可空，会在创建以及修改时在service层更新)

下面是各种类型下独特字段的描述。这些字段在模型层设计都是NULLABLE的，但在form与service需要有符合业务的限制。

### ANIME 动画

以下为动画特有的字段:
* `originalType`: 原作类型 (form可选，model可空)
* `boardcastType`: 放送类型 (form可选，model可空)
* `episodeDuration`: 单集时长 (form可选，model可空，不能小于0)
* `episodeTotalNum`: 总集数 (form可选，model默认1，且不能小于1)
* `episodePublishedNum`: 已发布集数 (form可选，model默认0，不能小于0且不能大于总集数)
* `episodePublishPlan`: 未来集数的发布计划
    - 它使用`[{index: 1, publishTime: "时间戳", episodeTitle: "xxx", actualEpisodeNum: 10}, ...]`的JSON结构来保存后续的发布计划。Array中的每一条对应未来的一集。
    - Array中项的数量不一定等于`总集数 - 已发布集数`，但一定小于等于这个数，且必须从下一个待发布集数开始。
    - index为集数，范围为1~总集数。这个在form输入时可以瞎填，service层处理时不会理会，而是一定会接在已发布集数的后面。
    - publishTime为发布时间点。
    - episodeTitle为该集标题，actualEpisodeNum为在动画中被标出来的集数。这两个字段可为null。这是两项纯内容的字段，与其他集数发布的业务逻辑无关。
    - episodePublishPlan在form可选；在model必定保存为一个`[]`JSON Array。
* `episodePublishedRecords`: 已发布的集数记录
    - 它拥有和episodePublishPlan相同的JSON结构(publishTime在这里可为null)。Array中的每一条对应已发布的一集。
    - Array中项的数量等于`已发布集数`；如果给出的内容数量不足，service层处理时会自行补满，且将除index外的所有字段置null。
    - episodePublishPlan在form可选；在model必定保存为一个`[]`JSON Array。

动画项目中存在一个动态机制“集数发布”，用于处理正在放映中定期更新的动画。动画存在总集数、已发布集数、已发布记录、发布计划。
- 已发布记录是一个较为宽松的记录表，它与已发布集数严格对应，但内容要求宽松可以都不填。
- 发布计划是更严谨一些的记录表，它记录未来要更新的集数表。当用户编辑发布计划时，service层会直接进行一次检查，从中挑出当前时间之前的记录，更新进已发布记录表，并增加已发布集数；当前时间之后的记录会作为未来即将发布的内容存下来，等待后台任务来更新。

此外，在Record 记录表业务中，含还有“用户观看的记录”这一个关联业务。详情参考Record章节。但如果在Project这里修改集数，还是会产生连锁影响：
- 如果修改了已发布集数，注意限制所有已看集数不能超过它；
- 如果修改了总集数，注意调整所有进度的status，以及更新所有已完成进度的已看集数，但不需要更新已放弃进度的已看集数。

### GAME 游戏

以下为游戏特有的字段:
* `platform`: 游戏可用平台 (form可选，默认[])
* `onlineType`: 联机类型 (form可选, model可空)

### MOVIE 电影

以下为电影特有的字段:
* `episodeDuration`: 单集时长 (form可选，model可空，不能小于0)
* `episodeTotalNum`: 总集数 (form可选，model默认1，且不能小于1)
* `episodePublishedNum`: 已发布集数 (form可选，model默认0，不能小于0且不能大于总集数)
* `episodePublishPlan`: 未来集数的发布计划 (与anime相同逻辑)
* `episodePublishedRecords`: 已发布的集数记录 (与anime相同逻辑)

### MANGA 漫画

以下为漫画特有的字段:
* `episodeTotalNum`: 总集数 (form可选，model默认1，且不能小于1)
* `episodePublishedNum`: 已发布集数 (form可选，model默认0，不能小于0且不能大于总集数)
* `episodePublishPlan`: 未来集数的发布计划 (与anime相同逻辑)
* `episodePublishedRecords`: 已发布的集数记录 (与anime相同逻辑)

## Record 记录与进度

### Record 记录

Record是用户对某个项目的观看/游玩/阅读记录，总之是使用记录。一个Record代表一个用户对一个Project的总体使用情况，而详细的分段进度则与RecordProgress有关。

以下是所有Record的公有字段:
* `id`: 唯一ID，主键，在数据库层自动自增
* `ownerId`: 用户ID
* `projectId`: 项目ID
* `specialAttention`: 订阅；一个类似收藏的标记，表示当前记录是否正处于特别关注下 (form可选，默认false)
* `status`: 当前状态；这是一个根据关联的RecordProgress的状态得来的状态，是一个缓存字段
* `progressCount`: 进度数量；与Record关联的RecordProgress数量是一致的，是一个缓存字段
* `startTime`, `endTime`: 记录开始与结束时间，它总是关联的RecordProgress中第一条进度的开始时间与最后一条进度的结束时间，是一个缓存字段
* `lastActivityTime`, `lastActivityEvent`: 记录用户在当前记录最后活动的字段；这部分业务尚未完善，暂且全部置为默认值(now与`{}`)
* `createTime`, `updateTime`: 记录创建时间与更新时间 (不可空，会在创建以及修改时在service层更新)

### RecordProgress 记录进度

RecordProgress是用户对某个项目的使用记录中，某一段的进度。一段进度代表用户从start到end的时间范围内在持续使用此项目。

以下是所有RecordProgress的公有字段:
* `id`: 唯一ID，主键，在数据库层自动自增
* `projectId`: 项目ID
* `recordId`: 记录ID
* `ordinal`: 进度序号，按照顺序从1开始
* `status`: 当前状态；这是一个既包含自动处理也包含可手动编辑部分的枚举字段，只不过仅代表了当前这条进度。详见后面的详细逻辑部分
* `startTime`, `endTime`: 记录开始与结束时间。这两个时间根据进度的状态，其非空要求有一定复杂度。详见后面的详细逻辑部分
* `createTime`, `updateTime`: 进度创建时间与更新时间 (不可空，会在创建以及修改时在service层更新)

RecordProgress还根据关联的Project的类型会有一些特有字段。

#### ANIME 动画类型进度

* `episodeWatchedNum`: 用户已看的集数 (不能小于0且不能大于已发布集数)
* `episodeWatchedRecords`: 用户已看的记录。
    - 它使用`[null, {watchedTime: "时间戳"}, ...]`的JSON结构。Array中的每一条对应已看的一集。
    - 注意它的留空属性。并不是每一集都会有对应的记录，此时该位置留空为null。这是因为观看记录不能由用户编辑，仅在用户手动推进观看集数时自动记录，此时若存在之前通过其他手段补齐的已看集数，就没有记录。并且通过其他手段补齐已看集数时，不需要立刻填充已看记录，它只需要在有实际观看记录时被填充。
* `followType`: 追/补/重看的状态；这是一个自动处理的字段，代表当前这条进度是追番、补番还是重看。相关处理逻辑已在代码中完善

#### GAME 游戏类型进度

* `platform`: 用户游玩时使用的平台 (form可选，默认[])

#### MOVIE 电影类型进度

* `episodeWatchedNum`: 用户已看的集数 (不能小于0且不能大于已发布集数)
* `episodeWatchedRecords`: 用户已看的记录 (与anime类型相同)

#### MANGA 漫画类型进度

* `episodeWatchedNum`: 用户已看的集数 (不能小于0且不能大于已发布集数)
* `episodeWatchedRecords`: 用户已看的记录 (与anime类型相同)

#### 记录与进度业务逻辑

从上面的字段可以看出，记录与进度不是一个放开让用户随意编辑字段的简单模型，它有较为严格的创建、推进和编辑要求。在以下的叙述中，会按照ANIME/MOVIE/MANGA类型(以下通称为EPISODE类型)和其他类型，区分讲述有集数的进度机制和无集数的进度机制。

* 创建: 用户从指定项目选择创建记录时，会给出3种不同的模式，供用户选择：
    1. SUBSCRIBE 订阅: 为此项目创建一个全新的记录并从头开始。此时立刻为记录创建第一条进度，将startTime设为现在，endTime为空，进度状态为WATCHING，将specialAttention设为true；
        - EPISODE类型: episodeWatchedNum设为0，episodeWatchedRecords置空，followType根据工具自动生成。
    2. SUPPLEMENT 补全: 为此项目创建记录，并立刻补全以前看过的记录。此时要求表单提供一组progress参数，且至少提供1个progress项；
        - progress参数包含一组进度，每个进度包含参数startTime, endTime；
        - 只有最后一条进度可以只填startTime不填endTime，表示此进度仍在进行中；前面的所有进度都必须填写endTime，startTime可以不在表单中提供且取和endTime相同的值；
        - 每一条进度的startTime必须小于等于endTime；前一条进度的endTime必须小于后一跳的startTime；
        - EPISODE类型: 进度还包含episodeWatchedNum参数，该参数只有最后一条仍在进行中的记录可填，表示进度中的已看数量；已完成的进度会忽略表单提供的参数，只被取为总集数。
    3. ONLY_RECORD 仅创建: 仅为此项目创建记录，不创建进度，状态设为ON_HOLD，不填写startTime与endTime。
* 创建进度: 用户为记录创建一跳新进度。依据表单中是否指定了相关参数，创建进度也有两种模式：
    1. 新进度: 不指定其他所需参数时，进入新进度创建模式。此时的前提要求是最后一条进度必须处于COMPLETED已完成状态，或者不存在任何进度。新建进度时，将该进度startTime设为现在，endTime为空，进度状态为WATCHING；
    2. 补全进度: 表单中指定了startTime, endTime中的任何一个时，补全此进度。
        - 如果两个都指定，则视作创建一条过去的完整记录，此时要求此进度的startTime和endTime不能与之前的某条进度有交叉，创建时会按插入模式将进度插入到指定顺序，且后推后面进度的序号；
        - 如果只指定endTime，视作一条start与end同时的完整记录，剩下的与上一条逻辑一致；
        - 如果只指定startTime，视作创建一条新进度，此时要求和1的新进度一致。
        - EPISODE类型: 表单还包含episodeWatchedNum参数，该参数只在“只指定startTime未指定endTime”的新进度创建模式下可用，且不填时默认为0；对于其他已完成的进度，此处逻辑和SUPPLEMENT一致，只会被取为总集数。
* 删除进度: 用户可以选择一条进度删除。此时后面的进度序号会迁移，且如果删除的是最后一跳记录，也需要注意整体状态的变化。
* 修改最新进度: 用户可以选择一条进度进行修改:
    - 对于未完成的进度:
        1. 可以修改其endTime，将其置为COMPLETED状态；
        2. 可以修改进度的status为DROPPED，表示此进度已被放弃，此时将其endTime改为当前时间，或者使用在表单中指定的endTime；
    - 对于已放弃的进度，如果此进度仍是最后一条进度: 
        1. 可以修改进度的status为WATCHING，并将endTime改为null。
    - EPISODE类型 对于未完成的进度: 
        1. 还可以直接修改已看集数，如果已看集数已达总集数，则此进度应当标记为COMPLETED状态，endTime改为当前时间；
        2. 修改endTime，将其置为COMPLETED状态时，已看集数需要同步置为总集数；
        3. 进度被放弃时，则不需要修改已看集数，保持当前集数；
    - EPISODE类型 对于已放弃的进度，如果此进度仍是最后一条进度:
        1. 同样可以修改为WATCHING，与其他类型一致。
* 进度推进: (仅EPISODE类型)这是作用于整个记录的操作。用户推进当前记录的进度：
    1. 如果当前记录没有没有进度，则创建一条新进度；
    2. 如果最后一条进度没有可推进的进度(已看集数已达已发布集数)，则应该报错；
    3. 否则为最后一条进度的已看集数+1。如果已看集数已达总集数，则此进度应当标记为COMPLETED状态，endTime改为当前时间。

EPISODE类型的“已完成进度”限制：
- 当 `project.episodePublishedNum < project.episodeTotalNum` 时，不允许任何进度处于 `COMPLETED` 状态（也不允许设置该进度的 `endTime != null`）。
- 只有当动画完全已发布（`episodePublishedNum == episodeTotalNum`）时，才能通过“补全进度/创建进度/修改最新进度”导致进度进入 `COMPLETED`，并自动设置 `endTime`。

字段联动: 在以上业务逻辑中，时时刻刻注意字段联动带来的状态变化。
- 一般的进度状态为WATCHING；
- 设置了endTime的进度需要被设置为COMPLETED；
- 进度可以被手动设置进入DROPPED状态；
- (仅EPISODE类型)已看集数达到总集数时，进度同样需要被设置为COMPLETED，且需要反过来自动设置endTime；
- (仅EPISODE类型)episodeWatchedRecords注意按照已看集数进行裁剪或补全，只有使用**进度推进**功能增加集数时，才会记录watchTime。
- (仅ANIME类型)followType字段需要根据每条记录的序号和startTime计算；

记录映射关系: 在以上业务逻辑中，时时刻刻注意Record中字段受RecordProgress影响的变化。
- startTime和endTime遵循描述的关系，设置为第一条记录的start和最后一条的end；
- status设置为最后一条进度的status；
- specialAttention需要注意，当status从WATCHING状态转换为COMPLETED/DROPPED时，将其设为false。

