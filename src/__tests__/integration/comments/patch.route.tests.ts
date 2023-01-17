import {
  mockedCommentRequest,
  mockedCommentUpdateRequest,
  mockedInvalidCommentRequest,
  mockedInvalidCommentUpdateRequest,
  mockedInvalidIdNumber,
  mockedProductRequest,
  mockedUserLogin,
  mockedUserRequest2,
} from "../../mocks";
import {
  AppDataSource,
  DataSource,
  User,
  app,
  mockedUserRequest,
  request,
  Products,
  Comments,
} from "../index";

describe("/products/comments/:id", () => {
  let connection: DataSource;
  const baseUrl = "/products";
  const userRepository = AppDataSource.getRepository(User);
  const productRepository = AppDataSource.getRepository(Products);
  const commentsRepository = AppDataSource.getRepository(Comments);

  beforeAll(async () => {
    await AppDataSource.initialize()
      .then(async (resp) => {
        connection = resp;
      })
      .catch((err) =>
        console.error("Error during data source initialization", err)
      );
  });

  beforeEach(async () => {
    await commentsRepository.createQueryBuilder().delete().execute();
    await productRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  it("PATCH /products/comments/:id - should be able to update a comment", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);
    const userLoginResponse = await request(app)
      .post("/session")
      .send(mockedUserLogin);
    const userToken = `Bearer ${userLoginResponse.body.token}`;

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const comment = commentsRepository.create({
      ...mockedCommentRequest,
      product,
      user,
    });
    await commentsRepository.save(comment);

    const response = await request(app)
      .patch(`${baseUrl}/comments/${comment.id}`)
      .set("Authorization", userToken)
      .send(mockedCommentUpdateRequest);

    expect(response.status).toBe(200);
    expect(response.body.comments_text).toBe(
      mockedCommentUpdateRequest.comments_text
    );
  });

  it("PATCH /products/comments/:id - should not be able to update a comment without authentication", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const comment = commentsRepository.create({
      ...mockedCommentRequest,
      product,
      user,
    });
    await commentsRepository.save(comment);

    const response = await request(app)
      .patch(`${baseUrl}/comments/${comment.id}`)
      .send(mockedCommentUpdateRequest);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("PATCH /products/comments/:id - should not be able to update a comment with invalid id", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);
    const userLoginResponse = await request(app)
      .post("/session")
      .send(mockedUserLogin);
    const userToken = `Bearer ${userLoginResponse.body.token}`;

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const comment = commentsRepository.create({
      ...mockedCommentRequest,
      product,
      user,
    });
    await commentsRepository.save(comment);

    const response = await request(app)
      .patch(`${baseUrl}/comments/${mockedInvalidIdNumber}`)
      .set("Authorization", userToken)
      .send(mockedCommentUpdateRequest);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("PATCH /products/comments/:id - should not be able to update another user comments", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);
    const userLoginResponse = await request(app)
      .post("/session")
      .send(mockedUserLogin);
    const userToken = `Bearer ${userLoginResponse.body.token}`;

    const userOwnerOfComment = userRepository.create(mockedUserRequest2);
    await userRepository.save(userOwnerOfComment);

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const comment = commentsRepository.create({
      ...mockedCommentRequest,
      product,
      user: userOwnerOfComment,
    });
    await commentsRepository.save(comment);

    const response = await request(app)
      .patch(`${baseUrl}/comments/${comment.id}`)
      .set("Authorization", userToken)
      .send(mockedCommentUpdateRequest);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });
});
