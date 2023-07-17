import slugify from 'slugify';

export class SlugGeneratorService {
  generate(string: string) {
    return slugify(string);
  }

  updateSlugByTitle<EntityT extends { title: string; slug: string }>(
    dataToUpdate: Partial<EntityT>,
    entity: EntityT,
  ) {
    if (dataToUpdate.slug) return dataToUpdate.slug;
    if (dataToUpdate.title && this.generate(entity.title) === entity.slug)
      return this.generate(dataToUpdate.title);
    return entity.slug;
  }
}
