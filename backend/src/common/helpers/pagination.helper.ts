import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationDto, PaginatedResult, PaginationMeta } from '../dto/pagination.dto';

export class PaginationHelper {
  /**
   * Apply pagination to TypeORM QueryBuilder
   */
  static async paginate<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationDto,
  ): Promise<PaginatedResult<T>> {
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    
    // Ensure page and limit are numbers
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;

    // Apply sorting
    queryBuilder.orderBy(
      queryBuilder.alias + '.' + sortBy,
      sortOrder
    );

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Get results and count
    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate meta
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data,
      meta,
    };
  }

  /**
   * Apply pagination to Repository.findAndCount
   */
  static async paginateRepository<T>(
    repository: Repository<T>,
    options: PaginationDto,
    findOptions: any = {},
  ): Promise<PaginatedResult<T>> {
    const { sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    
    // Ensure page and limit are numbers
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;

    const offset = (page - 1) * limit;

    // Merge pagination options
    const repositoryOptions = {
      ...findOptions,
      skip: offset,
      take: limit,
      order: {
        ...findOptions.order,
        [sortBy]: sortOrder,
      },
    };

    const [data, total] = await repository.findAndCount(repositoryOptions);

    // Calculate meta
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data,
      meta,
    };
  }

  /**
   * Apply search filter to QueryBuilder
   */
  static applySearch<T>(
    queryBuilder: SelectQueryBuilder<T>,
    searchFields: string[],
    searchTerm?: string,
  ): SelectQueryBuilder<T> {
    if (!searchTerm || !searchFields.length) {
      return queryBuilder;
    }

    const alias = queryBuilder.alias;
    const searchConditions = searchFields
      .map(field => `${alias}.${field} LIKE :search`)
      .join(' OR ');

    return queryBuilder.andWhere(`(${searchConditions})`, {
      search: `%${searchTerm}%`,
    });
  }

  /**
   * Apply status filter to QueryBuilder
   */
  static applyStatusFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    status?: string,
    statusField: string = 'status',
  ): SelectQueryBuilder<T> {
    if (!status) {
      return queryBuilder;
    }

    return queryBuilder.andWhere(`${queryBuilder.alias}.${statusField} = :status`, {
      status,
    });
  }
}