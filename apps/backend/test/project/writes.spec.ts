import * as request from 'supertest';
import { createTestApp } from '../utils/bootstrap';
import { closeInMemoryMongoServer } from '../utils/mongo-in-memory-server';
import { UserTier } from '../../src/user/core/enum/user-tier.enum';
import { Types } from 'mongoose';
import { ProjectCoreService } from '../../src/project/core/project-core.service';
import { ProjectTier } from '../../src/project/core/enums/project-tier.enum';
import { ClusterTier } from '../../src/cluster/core/enums/cluster-tier.enum';

describe('ProjectCoreController (reads)', () => {
  let bootstrap: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    bootstrap = await createTestApp();
  });

  beforeEach(async () => {
    await bootstrap.methods.beforeEach();
  });

  afterAll(async () => {
    await bootstrap.methods.afterAll();
  });

  it('updates project if user is member', async () => {
    // given
    const { user, project, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .put(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some updated name' });

    // then
    const updatedProject = await bootstrap.models.projectModel.findById(
      project.id,
    );

    expect(response.status).toBe(200);
    expect(updatedProject!.name).toBe('some updated name');
    expect(updatedProject!.creatorId).toBe(user.id);
  });

  it('creates new project for free user', async () => {
    // given
    const { user, cluster, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${cluster.id}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some name' });

    // then
    const projects = await bootstrap.models.projectModel.find({
      _id: new Types.ObjectId(response.body.project.id),
    });

    const apiKeys = await bootstrap.models.apiKeyModel.find({
      projectId: projects[0].id,
    });

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('some name');
    expect(projects[0].creatorId).toBe(user.id);
    expect(projects[0].clusterId).toBe(cluster.id);

    expect(apiKeys).toHaveLength(1);
    expect(apiKeys[0].projectId).toBe(projects[0].id);
  });

  it('creates new project for early bird user', async () => {
    // given
    const { user, cluster, token } =
      await bootstrap.utils.generalUtils.setupClaimed({
        email: 'a@a.pl',
        userTier: UserTier.EarlyBird,
      });

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${cluster.id}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some name' });

    // then
    const projects = await bootstrap.models.projectModel.find({
      _id: new Types.ObjectId(response.body.project.id),
    });

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('some name');
    expect(projects[0].tier).toBe(ProjectTier.EarlyBird);
  });

  it('does not let free user create more than 5 projects', async () => {
    // given (ALREADY HAS 1 PROJECT)
    const { project, token } =
      await bootstrap.utils.generalUtils.setupAnonymous();

    for (let i = 0; i < 3; i++) {
      await bootstrap.utils.projectUtils.createDefaultProject({
        clusterId: project.clusterId,
        userId: project.creatorId,
      });
    }

    // when
    const responseA = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${project.clusterId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some name 1' });

    const responseB = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${project.clusterId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some name 2' });

    // then
    expect(responseA.status).toBe(201);
    expect(responseB.status).toBe(409);
  });

  it('does not early bird user creator more than 20 projects', async () => {
    // given (ALREADY HAS 1 PROJECT)

    const { user, cluster, token } =
      await bootstrap.utils.generalUtils.setupClaimed({
        email: 'a@a.pl',
        userTier: UserTier.EarlyBird,
      });

    for (let i = 0; i < 18; i++) {
      await bootstrap.utils.projectUtils.createDefaultProject({
        userId: user.id,
        clusterId: cluster.id,
      });
    }

    // when
    const responseA = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${cluster.id}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some name 1' });

    const responseB = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${cluster.id}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'some name 2' });

    // then
    expect(responseA.status).toBe(201);
    expect(responseB.status).toBe(409);
  });

  it('does not let user create project if he is not a member of cluster', async () => {
    // given
    const setupA = await bootstrap.utils.generalUtils.setupAnonymous();
    const setupB = await bootstrap.utils.generalUtils.setupAnonymous();

    // when
    const response = await request(bootstrap.app.getHttpServer())
      .post(`/clusters/${setupA.project.clusterId}/projects`)
      .set('Authorization', `Bearer ${setupB.token}`)
      .send({ name: 'some name' });

    // then
    expect(response.status).toBe(403);
    expect(response.body.message).toBe('User is not a member of this cluster');
  });
});
