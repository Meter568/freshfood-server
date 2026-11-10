import sequelize from '../config/db.js';
import { DataTypes } from 'sequelize';

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    email: {type: DataTypes.STRING, allowNull: false, unique: true},
    password: {type: DataTypes.STRING, allowNull: true},
    role: {type: DataTypes.STRING, allowNull: false, defaultValue: 'user'},
    cityId: {type: DataTypes.INTEGER, allowNull: true},
    street: {type: DataTypes.STRING, allowNull: true},
    houseNumber: {type: DataTypes.STRING, allowNull: true},
    apartmentNumber: {type: DataTypes.STRING, allowNull: true},
    phoneNumber: {type: DataTypes.STRING, allowNull: true},
    inBlock: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
})

const Basket = sequelize.define('basket', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    userId: {type: DataTypes.INTEGER, allowNull: false},
    productId: {type: DataTypes.INTEGER, allowNull: false},
    quantity: {type: DataTypes.INTEGER, allowNull: false},
    price: {type: DataTypes.DOUBLE, allowNull: true},
})

const Product = sequelize.define('product', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    servername: {type: DataTypes.STRING, allowNull: false},
    trademarkId: {type: DataTypes.INTEGER, allowNull: true},
    countryId: {type: DataTypes.INTEGER, allowNull: true},
    description: {type: DataTypes.TEXT, allowNull: false},
    price: {type: DataTypes.DOUBLE, allowNull: false},
    offert: {type: DataTypes.DOUBLE, allowNull: false},
    categoryId: {type: DataTypes.INTEGER, allowNull: false},
    inStock: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true},
})

const ProductImages = sequelize.define('productImages', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    link: {type: DataTypes.STRING, allowNull: false},
    productId: {type: DataTypes.INTEGER, allowNull: false},
})

const Category = sequelize.define('category', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
    slug: {type: DataTypes.STRING, allowNull: true, unique: true},
    parent_id: {type: DataTypes.INTEGER, allowNull: true, references: {model: 'categories', key: 'id'}, onDelete: 'SET NULL'},
    logo: {type: DataTypes.STRING, allowNull: true },
    bgColor: {type: DataTypes.STRING, allowNull: false}
})

const Trademark = sequelize.define('trademark', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
})

const Country = sequelize.define('country', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
})

const City = sequelize.define('city', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, allowNull: false},
})

const Order = sequelize.define('order', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    userId: {type: DataTypes.INTEGER, allowNull: false},
    cityId: {type: DataTypes.INTEGER, allowNull: false},
    street: {type: DataTypes.STRING, allowNull: false},
    houseNumber: {type: DataTypes.STRING, allowNull: true},
    apartmentNumber: {type: DataTypes.STRING, allowNull: true},
    phoneNumber: {type: DataTypes.STRING, allowNull: true},
    status: {type: DataTypes.STRING, allowNull: false},
    totalAmount: {type: DataTypes.DOUBLE, allowNull: false},
    paymentMethod: {type: DataTypes.STRING, allowNull: false},
    paymentStatus: {type: DataTypes.STRING, allowNull: false},
    cardNumber: {type: DataTypes.STRING, allowNull: true},
    deliveryStatus: {type: DataTypes.STRING, allowNull: false, defaultValue: 'Очікує на розгляд'},
})

const OrderItem = sequelize.define('orderItem', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    orderId: {type: DataTypes.INTEGER, allowNull: false},
    productId: {type: DataTypes.INTEGER, allowNull: false},
    subcategoryId: {type: DataTypes.INTEGER, allowNull: false},
    quantity: {type: DataTypes.INTEGER, allowNull: false},
    unitPrice: {type: DataTypes.DOUBLE, allowNull: false},
})

const VerificationCode = sequelize.define('verificationCode', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, allowNull: false},
    code: {type: DataTypes.STRING, allowNull: false},
    type: {type: DataTypes.ENUM('registration', 'password_reset', 'email_change'), allowNull: false},
    expiresAt: {type: DataTypes.DATE, allowNull: false},
    isUsed: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
})

User.hasMany(Basket, { foreignKey: 'userId', onDelete: 'CASCADE' });
Basket.belongsTo(User, { foreignKey: 'userId' });

User.belongsTo(City, { foreignKey: 'cityId' });
City.hasMany(User, { foreignKey: 'cityId' });

Product.hasMany(Basket, { foreignKey: 'productId', onDelete: 'CASCADE' });
Basket.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(ProductImages, { foreignKey: 'productId', as: 'productImages' });
ProductImages.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

City.hasMany(Order, { foreignKey: 'cityId' });
Order.belongsTo(City, { foreignKey: 'cityId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Trademark.hasMany(Product, { foreignKey: 'trademarkId' });
Product.belongsTo(Trademark, { foreignKey: 'trademarkId' });

Country.hasMany(Product, { foreignKey: 'countryId' });
Product.belongsTo(Country, { foreignKey: 'countryId' });

export { User, Basket, Product, ProductImages, Category, City, Order, OrderItem, VerificationCode, Trademark, Country };     