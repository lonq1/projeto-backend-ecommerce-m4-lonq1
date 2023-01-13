import {
  mockedAdminLogin,
  mockedAdminRequest,
  mockedInvalidIdNumber,
  mockedProductRequest,
  mockedUserLogin,
} from "../../mocks";
import {
  AppDataSource,
  DataSource,
  User,
  app,
  mockedUserRequest,
  request,
  Products,
  Orders,
  OrdersProducts,
} from "../index";

describe("/orders/:id", () => {
  let connection: DataSource;
  const baseUrl = "/orders";
  const userRepository = AppDataSource.getRepository(User);
  const productRepository = AppDataSource.getRepository(Products);
  const ordersRepository = AppDataSource.getRepository(Orders);
  const ordersProductsRepository = AppDataSource.getRepository(OrdersProducts);

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
    await ordersProductsRepository.createQueryBuilder().delete().execute();
    await productRepository.createQueryBuilder().delete().execute();
    await ordersRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  it("PATCH /orders/:id - should be able to update order", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);
    const admin = userRepository.create(mockedAdminRequest);
    await userRepository.save(admin);

    const adminLoginResponse = await request(app)
      .post("/session")
      .send(mockedAdminLogin);
    const adminToken = `Bearer ${adminLoginResponse.body.token}`;

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const order = ordersRepository.create({ user });
    await ordersRepository.save(order);

    const orderProduct = ordersProductsRepository.create({
      amount: 10,
      orders: order,
      product,
    });
    await ordersProductsRepository.save(orderProduct);

    const response = await request(app)
      .patch(`${baseUrl}/${order.id}`)
      .set("Authorization", adminToken)
      .send({
        delivered: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("delivered");
    expect(response.body.delivered).toBe(true);
  });
  it("PATCH /orders/:id - should not be able to update order without authentication", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const order = ordersRepository.create({ user });
    await ordersRepository.save(order);

    const orderProduct = ordersProductsRepository.create({
      amount: 10,
      orders: order,
      product,
    });
    await ordersProductsRepository.save(orderProduct);

    const response = await request(app).patch(`${baseUrl}/${order.id}`).send({
      delivered: true,
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
  it("PATCH /orders/:id - should not be able to update order without being admin", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);
    const userLoginResponse = await request(app)
      .post("/session")
      .send(mockedUserLogin);
    const userToken = `Bearer ${userLoginResponse.body.token}`;

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const order = ordersRepository.create({ user });
    await ordersRepository.save(order);

    const orderProduct = ordersProductsRepository.create({
      amount: 10,
      orders: order,
      product,
    });
    await ordersProductsRepository.save(orderProduct);

    const response = await request(app)
      .patch(`${baseUrl}/${order.id}`)
      .set("Authorization", userToken)
      .send({
        delivered: true,
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty("message");
  });
  it("PATCH /orders/:id - should not be able to update order without valid data", async () => {
    const user = userRepository.create(mockedUserRequest);
    await userRepository.save(user);
    const admin = userRepository.create(mockedAdminRequest);
    await userRepository.save(admin);

    const adminLoginResponse = await request(app)
      .post("/session")
      .send(mockedAdminLogin);
    const adminToken = `Bearer ${adminLoginResponse.body.token}`;

    const product = productRepository.create(mockedProductRequest);
    await productRepository.save(product);

    const order = ordersRepository.create({ user });
    await ordersRepository.save(order);

    const orderProduct = ordersProductsRepository.create({
      amount: 10,
      orders: order,
      product,
    });
    await ordersProductsRepository.save(orderProduct);

    const response = await request(app)
      .patch(`${baseUrl}/${order.id}`)
      .set("Authorization", adminToken)
      .send({
        delivered: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("delivered");
    expect(response.body.delivered).toBe(true);
  });
});