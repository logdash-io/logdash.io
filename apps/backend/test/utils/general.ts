import { INestApplication } from '@nestjs/common';
import { ClusterSerialized } from '../../src/cluster/core/entities/cluster.interface';
import { ProjectSerialized } from '../../src/project/core/entities/project.interface';
import * as request from 'supertest';
import { CreateProjectBody } from '../../src/project/core/dto/create-project.body';
import { UserSerialized } from '../../src/user/core/entities/user.interface';
import { CreateProjectResponse } from '../../src/project/core/dto/create-project.response';
import { getModelToken } from '@nestjs/mongoose';
import { UserEntity } from '../../src/user/core/entities/user.entity';
import { Model, Types } from 'mongoose';
import { AccountClaimStatus } from '../../src/user/core/enum/account-claim-status.enum';
import { ApiKeySerialized } from '../../src/api-key/core/entities/api-key.interface';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';

export class GeneralUtils {
  private readonly userModel: Model<UserEntity>;

  constructor(private readonly app: INestApplication<any>) {
    this.userModel = this.app.get(getModelToken(UserEntity.name));
  }

  public async setupAnonymous(dto?: { userTier?: UserTier }): Promise<{
    token: string;
    user: UserSerialized;
    cluster: ClusterSerialized;
    project: ProjectSerialized;
    apiKey: ApiKeySerialized;
  }> {
    // user
    const userResponse = await request(this.app.getHttpServer())
      .post('/users/anonymous')
      .send();

    const token: string = userResponse.body.token;
    const user: UserSerialized = userResponse.body.user;

    if (dto?.userTier) {
      await this.userModel.updateOne(
        {
          _id: new Types.ObjectId(user.id),
        },
        {
          tier: dto.userTier,
        },
      );
    }

    // cluster
    const clusterResponse = await request(this.app.getHttpServer())
      .get('/users/me/clusters')
      .set('Authorization', `Bearer ${token}`);

    const cluster: ClusterSerialized = clusterResponse.body[0];

    // project
    const createProjectBody: CreateProjectBody = {
      name: `Test project for user ${user.id}`,
    };

    const projectResponse = await request(this.app.getHttpServer())
      .post(`/clusters/${cluster.id}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send(createProjectBody);

    const project: ProjectSerialized = (
      projectResponse.body as CreateProjectResponse
    ).project;

    // api key
    const apiKeysResponse = await request(this.app.getHttpServer())
      .get(`/projects/${project.id}/api_keys`)
      .set('Authorization', `Bearer ${token}`);

    const apiKey: ApiKeySerialized = apiKeysResponse.body[0];

    return {
      token,
      user,
      cluster,
      project,
      apiKey,
    };
  }

  public async setupClaimed(dto: {
    email: string;
    userTier?: UserTier;
  }): Promise<{
    token: string;
    user: UserSerialized;
    cluster: ClusterSerialized;
    project: ProjectSerialized;
  }> {
    const anonymousResult = await this.setupAnonymous({
      userTier: dto.userTier,
    });

    await this.userModel.updateOne(
      {
        _id: new Types.ObjectId(anonymousResult.user.id),
      },
      {
        accountClaimStatus: AccountClaimStatus.Claimed,
        email: dto.email,
      },
    );

    const userResponse = await request(this.app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${anonymousResult.token}`);

    const user = userResponse.body;

    return {
      ...anonymousResult,
      user,
    };
  }
}
